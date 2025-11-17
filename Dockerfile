# ---- Dockerfile ----
FROM node:20-bullseye

# Installer dépendances système
RUN apt update && apt install -y openjdk-17-jdk git unzip wget && rm -rf /var/lib/apt/lists/*

# Installer Expo & EAS CLI
RUN npm install -g expo-cli eas-cli

# Définir le chemin du SDK Android (⚠️ syntaxe corrigée)
ENV ANDROID_HOME=/opt/android-sdk

# Installer le SDK Android manuellement
RUN mkdir -p $ANDROID_HOME && \
    cd /opt && \
    wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdline-tools.zip && \
    mkdir -p $ANDROID_HOME/cmdline-tools && \
    unzip cmdline-tools.zip -d $ANDROID_HOME/cmdline-tools && \
    mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest && \
    rm cmdline-tools.zip && \
    yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses

# Installer les plateformes et outils Android nécessaires
RUN yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager \
    "platform-tools" \
    "platforms;android-36" \
    "build-tools;36.0.0" \
    "cmdline-tools;latest" \
    "ndk;27.1.12297006"

# Ajouter le SDK Android au PATH
ENV PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$ANDROID_HOME/platform-tools

# Dossier de travail
WORKDIR /app

# Commande par défaut
CMD ["bash"]
