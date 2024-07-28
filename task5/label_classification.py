import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import pandas as pd
import numpy as np

class LabelClassifier:
    def __init__(self, data_path):
        self.data_path = data_path
        self.model = None
        self.label_encoder = LabelEncoder()

    def load_data(self):
        # Load data from the provided path
        data = pd.read_csv(self.data_path)
        self.features = data.drop('label', axis=1).values
        self.labels = self.label_encoder.fit_transform(data['label'])
        self.labels = tf.keras.utils.to_categorical(self.labels)
        
    def preprocess_data(self, test_size=0.2, random_state=42):
        self.x_train, self.x_test, self.y_train, self.y_test = train_test_split(
            self.features, self.labels, test_size=test_size, random_state=random_state)

    def build_model(self, input_shape):
        self.model = Sequential([
            Dense(128, activation='relu', input_shape=(input_shape,)),
            Dropout(0.5),
            Dense(64, activation='relu'),
            Dropout(0.5),
            Dense(self.labels.shape[1], activation='softmax')
        ])
        self.model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

    def train_model(self, epochs=50, batch_size=32):
        self.model.fit(self.x_train, self.y_train, epochs=epochs, batch_size=batch_size, validation_split=0.2)

    def evaluate_model(self):
        loss, accuracy = self.model.evaluate(self.x_test, self.y_test)
        print(f"Test Accuracy: {accuracy * 100:.2f}%")
        return accuracy

    def predict(self, new_data):
        if len(new_data.shape) == 1:
            new_data = new_data.reshape(1, -1)
        predictions = self.model.predict(new_data)
        predicted_labels = self.label_encoder.inverse_transform(np.argmax(predictions, axis=1))
        return predicted_labels


classifier = LabelClassifier('./data.csv')
classifier.load_data()
classifier.preprocess_data()
classifier.build_model(input_shape=classifier.features.shape[1])
classifier.train_model(epochs=10)
accuracy = classifier.evaluate_model()

# Predict a new data instance (ensure the new data has the same number of features as the training data)
new_data_instance = np.array([0.5, 0.3, 0.2, 0.1])  # Example input, adjust based on actual feature size
predicted_label = classifier.predict(new_data_instance)
print(f"Predicted Label: {predicted_label[0]}")
