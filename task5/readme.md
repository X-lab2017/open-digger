# Automatic Label Classification

This project implements an automatic label classification task using machine learning methods.

## Description

Existing repository label data relies heavily on manual labeling. This project utilizes machine learning methods to automatically identify and annotate data for any subclass of label data.

* data.csv is a category data extracted from Open-Digger/Labeled_data for model training and testing.

* label_classification.ipynb for model training and testing.

* label_classification.py establishes a neural network model for classification tasks.

* label_classification_1.ipynb  implements label classification.

    1. Data preprocessing: Read data and split it into training and testing sets.

    2. Feature extraction: Use TfidfVectorizer to extract features.

    3. Define neural network model: Use Keras to define a neural network model and wrap it with scikit-learn.

    4. Train models: Define and train multiple models (Logistic Regression, SVM, Random Forest, Neural Network).

    5. Evaluate models: Use classification_report to generate classification reports.

* label_classification_2.ipynb

    1. Train and save models:

        + Use joblib to save Logistic Regression, SVM, and Random Forest models.

        + Use Keras's save method to save neural network models.

        + Save TfidfVectorizer to perform the same feature extraction on new data.
    
    2. Load the saved model and perform classification:

        + Read the saved TfidfVectorizer to perform feature extraction on new data.

        + Load the saved model and make predictions.

        + Display the classification results of the new data.

