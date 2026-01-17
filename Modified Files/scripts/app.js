// Matrix Diagonalization Application JavaScript

/*
Changes
1. Removed Pyscript functionalities stuff, (waitForPyScript(), initializedApp())
2. Removed setupDiagonalizeButton() as HTML has an available onclick method.
3. Removed  (no more Pyscript)

4. Added tableToMatrix to simplify conversion
5. Added sendMatrix to Python (Backend Functionality)
- Currently uses internal


*/

// Generate sample identity matrix for given size
function generateSampleMatrix(size) {
    const matrix = [];
    for (let i = 0; i < size; i++) {
        const row = [];
        for (let j = 0; j < size; j++) {
            row.push(i === j ? 1 : 0);
        }
        matrix.push(row);
    }
    return matrix;
}

// Change matrix size value base on current selection
function setupMatrixSizeSelector() {
    const selector = document.getElementById("matrixSize");
    if (selector) {
        selector.addEventListener("change", function() {
            const size = parseInt(this.value);
            createMatrixTable(size);
            document.getElementById("output").innerHTML = "";
            console.log(`Matrix resized to ${size}x${size}`);
        });
    }
}
window.addEventListener("DOMContentLoaded", () => {
    setupMatrixSizeSelector(); // attach change listener

    // Create initial matrix based on selected value
    const selector = document.getElementById("matrixSize");
    const size = parseInt(selector.value, 10); // e.g., 1 for 1x1
    createMatrixTable(size);
});

// Create matrix table dynamically
function createMatrixTable(size) {
    const table = document.getElementById("matrixTable");
    const tbody = table.getElementsByTagName("tbody")[0];
    tbody.innerHTML = "";
    
    // Generate sample matrix
    const sampleMatrix = generateSampleMatrix(size);
    
    for (let i = 0; i < size; i++) {
        const row = document.createElement("tr");
        for (let j = 0; j < size; j++) {
            const cell = document.createElement("td");
            const input = document.createElement("input");
            input.type = "number";
            input.value = sampleMatrix[i][j];
            input.step = "any";
            input.className = "matrix-input";
            input.setAttribute("aria-label", `Element [${i+1},${j+1}]`);
            cell.appendChild(input);
            row.appendChild(cell);
        }
        tbody.appendChild(row);
    }
}

// Validate matrix input
function validateMatrix() {
    const table = document.getElementById("matrixTable");
    const rows = table.getElementsByTagName("tr");
    const output = document.getElementById("output");
    
    if (rows.length === 0) {
        output.innerHTML = "<p style='color: red;'><strong>Error:</strong> Matrix is empty</p>";
        return false;
    }
    
    // Check all cells have numeric values
    for (let i = 0; i < rows.length; i++) {
        const inputs = rows[i].getElementsByTagName("input");
        for (let j = 0; j < inputs.length; j++) {
            const val = inputs[j].value.trim();
            if (val === '' || isNaN(val)) {
                output.innerHTML = `<p style='color: red;'><strong>Error:</strong> All cells must contain valid numbers (Cell [${i+1},${j+1}] is invalid)</p>`;
                inputs[j].focus();
                inputs[j].style.borderColor = "red";
                return false;
            }
        }
    }
    
    // Clear error styling
    const allInputs = table.getElementsByTagName("input");
    for (let input of allInputs) {
        input.style.borderColor = "";
    }
    
    return true;
}

// Transform table inputs into Matrix -> Send to Python
function tableToMatrix() {

    if(!validateMatrix()) return;

    const table = document.getElementById("matrixTable");
    const matrix = [];

    // Append table inputs into a matrix
    for (let i = 0; i < table.rows.length; i++) {
        const row = [];
        for (let j = 0; j < table.rows[i].cells.length; j++) {
            row.push(Number(table.rows[i].cells[j].children[0].value));
        }
        matrix.push(row);
    }

    document.getElementById("output").innerHTML ="<p style='color:#1976d2;text-align:center'><strong>Processing matrix...</strong></p>";

    sendMatrixToPython(matrix);
}

// Send converted matrix into Python
function sendMatrixToPython(matrix) {
    //Send to API endpoint
    fetch("/api/matrix", { // URL used from Flask Backend
        method: "POST", // Method used -> POST (Sends data to the server)
        headers: { "Content-Type": "application/json" }, // Content Type (Tells server it's JSON)
        body: JSON.stringify({ matrix: matrix }) // Converts the matrix from here into a JSON File.
    })
    // Get Response -> converts to JSON again
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
            });
        }
        
        // Check if response has content
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            return response.text().then(text => {
                throw new Error(`Expected JSON but got: ${contentType}. Response: ${text.substring(0, 200)}`);
            });
        }
        
        return response.json();
    })
    // Send Data (Converted JSON) to displayDiagonalization
    .then(data => {
        displayDiagonalization(data)
    })
    // Catch Error
    .catch(error => {
        console.error("Error:", error);
        document.getElementById("output").innerHTML = 
            `<p style='color:red;text-align:center'><strong>Error: ${error.message}</strong></p>`;
    });
}

// Display diagonalization result
function displayDiagonalization(data) {
    const output = document.getElementById("output");

    // Show input matrix and backend message
    let html = `<p><b>Input Matrix A: \\[ ${data.A || ''} \\]</b></p>`;

    if (data.status === "success") {
        // Green Success Highlight Box
        html = `
            <div style='background-color: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; border-radius: 4px; margin: 10px 0;'>
                <p style='color: #2e7d32; font-weight: bold; margin: 0 0 10px 0;'>✓ Matrix IS Diagonalizable</p>
            </div>
        ` + html;

        // Append P, D, verification
        html += `
            <p><b>Matrix P (eigenvectors): \\[ ${data.P} \\]</b></p>
            <p><b>Diagonal Matrix D (eigenvalues): \\[ ${data.D} \\]</b></p>
            <p><b>Verification P⁻¹ A P = D: \\[ ${data.P_inv} \\
            \ ${data.A} \\
            \ ${data.P} \\ =
            \ ${data.verification} \\]</b></p>
        `;
    } else if (data.status === "failure" || data.status === "error") {
        // Red Error/Failure Highlight Box
        html = `
            <div style='background-color: #ffebee; border-left: 4px solid #f44336; padding: 15px; border-radius: 4px; margin: 10px 0;'>
                <p style='color: #c62828; font-weight: bold; margin: 0 0 10px 0;'>✗ ${data.status === "failure" ? "Matrix NOT Diagonalizable" : "Error Occurred"}</p>
            </div>
        ` + html;
    }

    output.innerHTML = html;

    // Render MathJax for all LaTeX
    MathJax.typesetPromise();
}
