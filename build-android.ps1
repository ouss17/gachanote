# ---- build-android.ps1 ----
# Ce script build ton app Expo Android localement via Docker sous Windows

# Étape 1 : Construire l’image Docker (si elle n’existe pas déjà)
Write-Host "Construction de l'image Docker Expo..."
docker build -t expo-builder .

# Étape 2 : Lancer le conteneur et exécuter le build
Write-Host "Lancement du build local Android..."
docker run --rm -it `
  -v ${PWD}:/app `
  -w /app `
  expo-builder bash -c "rm -rf node_modules package-lock.json && npm cache clean --force && npm install && npx expo prebuild --clean && eas build -p android --local"


Write-Host "Build terminé ! Vérifie le dossier dist/ ou build/ pour ton .aab"

# Déplacer les artefacts (.aab/.apk) vers un dossier ignoré par git
$artifactDir = Join-Path $PWD 'android-artifacts'
New-Item -ItemType Directory -Force -Path $artifactDir | Out-Null
Get-ChildItem -Path $PWD -Recurse -Include *.aab,*.apk -ErrorAction SilentlyContinue |
    ForEach-Object {
        Move-Item -Path $_.FullName -Destination $artifactDir -Force
        Write-Host "Déplacé: $($_.Name) -> $artifactDir"
    }

# Lancer le script avec :
# .\build-android.ps1
