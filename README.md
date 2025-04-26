El objetivo de este proyecto es desarrollar un modelo que sea capaz de identificar automáticamente el sentimiento expresado en un tuit, ya sea positivo, negativo o neutral, utilizando técnicas de procesamiento de lenguaje natural (NLP) y un algoritmo de clasificación supervisada llamado Naive Bayes.

En redes sociales como Twitter, miles de usuarios comparten opiniones diariamente sobre productos, servicios, eventos y temas de interés general. Poder analizar este contenido de manera automática permite a empresas y organizaciones tomar decisiones más informadas, medir la percepción pública y responder de manera más eficaz a las necesidades de los usuarios.

El proyecto sigue un enfoque estructurado que inicia con la recopilación y preparación de los datos, donde se limpian los textos, se eliminan caracteres innecesarios y se transforman en un formato comprensible para el modelo. Posteriormente, se dividen los datos en conjuntos de entrenamiento y prueba para garantizar que el modelo pueda generalizar su aprendizaje.

El modelo de Naive Bayes es entrenado con representaciones numéricas de los tuits, generadas mediante técnicas como Bag-of-Words o TF-IDF, que capturan la importancia de las palabras dentro del texto. Una vez entrenado, se evalúa su desempeño utilizando métricas como precisión, recall, F1-score y la matriz de confusión.

Para facilitar su uso, el modelo se despliega en una aplicación web desarrollada con Flask, que permite a cualquier usuario ingresar un texto y obtener instantáneamente el sentimiento predicho, junto con el tiempo de respuesta. Esto convierte el modelo en una herramienta práctica, accesible y fácilmente integrable en otros sistemas.

Para ejecutar este proyecto en tu máquina local, sigue los siguientes pasos:

Clona el repositorio:
git clone https://github.com/tu_usuario/proyecto-clasificacion-sentimientos.git
cd proyecto-clasificacion-sentimientos

Crea un entorno virtual 
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

Instala las dependencias:
pip install -r requirements.txt

Ejecuta la aplicación:
python app.py

 Uso
Una vez ejecutada la aplicación, puedes acceder a ella desde tu navegador en:
http://localhost:5000

Rutas disponibles:

/ → Interfaz básica para ingresar un texto y obtener la predicción del sentimiento.

/predecir → Ruta POST que recibe un texto y retorna el sentimiento predicho (positivo, negativo, neutral) y el tiempo de respuesta.

/reporte → Muestra las métricas de evaluación del modelo (precisión, recall, F1-score).

Arquitectura
La arquitectura del proyecto está dividida en varios módulos principales:

proyecto-clasificacion-sentimientos/
│
├── app.py                  ← Punto de entrada. Lanza el servidor Flask.
├── model/
│   └── naive_bayes.py      ← Clase personalizada que implementa el modelo Naive Bayes.
├── utils/
│   ├── preprocessing.py    ← Funciones para limpieza y preparación del texto.
│   └── model_utils.py      ← Funciones para entrenar, guardar, cargar y evaluar el modelo.
├── templates/
│   └── index.html          ← Página web básica para ingresar texto y ver la predicción.
├── static/
│   └── style.css           ← Estilos de la interfaz web.
├── data/
│   └── tweets.csv          ← Conjunto de datos con tuits y su respectivo sentimiento.
├── modelo_entrenado.pkl    ← Archivo serializado del modelo ya entrenado.
└── requirements.txt        ← Lista de dependencias necesarias.
