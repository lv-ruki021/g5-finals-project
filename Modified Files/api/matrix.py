from flask import Flask, request, jsonify
from flask_cors import CORS
import sympy as sp

# Vercel Serverless Function for Matrix Diagonalization
# This file is automatically served at /api/matrix

app = Flask(__name__)
CORS(app)  # allow frontend JS fetch

@app.route("/", methods=["POST"]) # Root route for this serverless function
def diagonalize_clicked():
    try:
        # Get input
        data = request.get_json() # Initializing the method above, allows for easier request

        matrix_data = data.get("matrix") # Converts JSON matrix in Matrix Array
        
        # Check if there's a Matrix
        if not matrix_data:
            return jsonify({
                "status": "error",
                "message": "No matrix data received."
            }), 400

        M = sp.Matrix(matrix_data) # Converts to Sympy Matrix
        a_latex = sp.latex(M)

        # Ensure all elements are numeric
        if not all(elem.is_real or elem.is_complex for elem in M):
            return jsonify({
                "status": "error",
                "message": "All matrix elements must be numeric."
            }), 400

        # Check Matrix diagonalizability
        if not M.is_diagonalizable():
            return jsonify({
                "status": "failure",
                "A": a_latex,
                "message": "Matrix is NOT diagonalizable (defective matrix)."
            })

        # Diagonalize
        P, D = M.diagonalize()

        P = P.applyfunc(lambda x: sp.nsimplify(x, rational=True))
        D = D.applyfunc(lambda x: sp.nsimplify(x, rational=True))

        p_latex = sp.latex(P)
        d_latex = sp.latex(D)
        pinv_latex = sp.latex(P.inv())
        verification = P.inv() * M * P

        # Returns it back as JSON files
        return jsonify({
            "status": "success",
            "A": a_latex,
            "P": p_latex,
            "D": d_latex,
            "P_inv": pinv_latex,
            "verification": sp.latex(verification),
            "message": "Matrix is Diagonalizable"
        })
        
    # Catch error
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
