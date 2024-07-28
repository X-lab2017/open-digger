# Automatic Label Classification

This project implements an automatic label classification task using machine learning methods.

## Description

Existing repository label data relies heavily on manual labeling. This project utilizes machine learning methods to automatically identify and annotate data for any subclass of label data.
* data.csv is a category data extracted from Open-Digger/Labeled_data for model training and testing.
* label_classification.ipynb for model training and testing
* label_classification_1.ipynb  implements label classification
    1. Data preprocessing: Read data and split it into training and testing sets.
    2. Feature extraction: Use TfidfVectorizer to extract features.
    3. Define neural network model: Use Keras to define a neural network model and wrap it with scikit-learn.
    4. Train models: Define and train multiple models (Logistic Regression, SVM, Random Forest, Neural Network).
    5. Evaluate models: Use classification_report to generate classification reports.

## Prerequisites

- Python 3.8+
- Pandas
- scikit-learn
- joblib

## Installation

1. Clone the repository:
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2. Install the required packages:
    ```bash
    pip install -r requirements.txt
    ```

## Usage

1. Prepare your labeled data in a CSV file with columns `text` and `label`.

2. Run the training script:
    ```bash
    python train.py --data labeled_data.csv
    ```

3. The trained model and vectorizer will be saved as `label_classifier_model.pkl` and `vectorizer.pkl`.

## License

This project is licensed under the MIT License.
