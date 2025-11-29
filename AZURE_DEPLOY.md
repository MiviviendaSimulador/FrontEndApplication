# Guía de Despliegue en Azure App Service

## Configuración en Azure Portal

### 1. Configuración Básica
- **Publish**: Code
- **Runtime stack**: Node 18 LTS o Node 20 LTS
- **Operating System**: Linux (recomendado)
- **Region**: Tu región preferida

### 2. Comandos de Inicio
Azure App Service ejecutará automáticamente:
- `npm install` (instalación de dependencias)
- `npm run build` (construcción de la aplicación)
- `npm start` (inicio del servidor)

### 3. Variables de Entorno (si las necesitas)
Si tu aplicación usa variables de entorno (por ejemplo, para Supabase):
1. Ve a Azure Portal → Tu App Service
2. Configuration → Application settings
3. Agrega las variables necesarias:
   - `VITE_SUPABASE_URL` (si usas Vite env vars)
   - `VITE_SUPABASE_ANON_KEY`
   - O cualquier otra variable que necesites

**Nota**: Las variables de Vite deben comenzar con `VITE_` para ser accesibles en el cliente.

### 4. Métodos de Despliegue

#### Opción A: Azure CLI
```bash
# Instalar Azure CLI si no lo tienes
# https://docs.microsoft.com/cli/azure/install-azure-cli

# Login
az login

# Desplegar
az webapp up --name mivivienda-2025 --resource-group FinanzasJorgeSry --runtime "NODE:18-lts"
```

#### Opción B: Git Deploy
1. En Azure Portal → Tu App Service → Deployment Center
2. Selecciona tu fuente (GitHub, Azure Repos, etc.)
3. Conecta tu repositorio
4. Azure desplegará automáticamente en cada push

#### Opción C: ZIP Deploy
```bash
# Construir la aplicación localmente
npm run build

# Crear ZIP (excluyendo node_modules)
# Luego subir el ZIP desde Azure Portal → Deployment Center → ZIP Deploy
```

### 5. Verificar el Despliegue
- Visita: `https://mivivienda-2025.azurewebsites.net`
- Revisa los logs en: Azure Portal → Tu App Service → Log stream

### 6. Troubleshooting

#### Si la aplicación no inicia:
1. Revisa los logs: `az webapp log tail --name mivivienda-2025 --resource-group FinanzasJorgeSry`
2. Verifica que el puerto esté usando `process.env.PORT`
3. Asegúrate de que `npm start` esté en los scripts de package.json

#### Si hay errores de build:
1. Verifica que todas las dependencias estén en `dependencies` (no solo `devDependencies`)
2. Revisa que el script `build` genere la carpeta `build/`

#### Si las rutas no funcionan:
- El servidor Express ya está configurado para redirigir todas las rutas a `index.html` (SPA routing)

## Estructura de Archivos Creados

- `server.js`: Servidor Express para servir archivos estáticos
- `.deployment`: Configuración para que Azure ejecute el build durante el despliegue
- `web.config`: Configuración para Windows (si usas Windows en lugar de Linux)
- `package.json`: Actualizado con `express` y script `start`

## Notas Importantes

- El servidor de Supabase Functions (`src/supabase/functions/server/index.tsx`) se despliega por separado en Supabase, no en Azure
- Azure solo sirve el frontend React
- El puerto se configura automáticamente mediante `process.env.PORT` (Azure lo asigna)

