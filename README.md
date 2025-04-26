El objetivo de este proyecto es desarrollar un modelo que sea capaz de identificar automáticamente el sentimiento expresado en un tuit, ya sea positivo, negativo o neutral, utilizando técnicas de procesamiento de lenguaje natural (NLP) y un algoritmo de clasificación supervisada llamado Naive Bayes.

En redes sociales como Twitter, miles de usuarios comparten opiniones diariamente sobre productos, servicios, eventos y temas de interés general. Poder analizar este contenido de manera automática permite a empresas y organizaciones tomar decisiones más informadas, medir la percepción pública y responder de manera más eficaz a las necesidades de los usuarios.

El proyecto sigue un enfoque estructurado que inicia con la recopilación y preparación de los datos, donde se limpian los textos, se eliminan caracteres innecesarios y se transforman en un formato comprensible para el modelo. Posteriormente, se dividen los datos en conjuntos de entrenamiento y prueba para garantizar que el modelo pueda generalizar su aprendizaje.

El modelo de Naive Bayes es entrenado con representaciones numéricas de los tuits, generadas mediante técnicas como Bag-of-Words o TF-IDF, que capturan la importancia de las palabras dentro del texto. Una vez entrenado, se evalúa su desempeño utilizando métricas como precisión, recall, F1-score y la matriz de confusión.

Para facilitar su uso, el modelo se despliega en una aplicación web desarrollada con Flask, que permite a cualquier usuario ingresar un texto y obtener instantáneamente el sentimiento predicho, junto con el tiempo de respuesta. Esto convierte el modelo en una herramienta práctica, accesible y fácilmente integrable en otros sistemas.
