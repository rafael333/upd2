# 🐙 Configuração do GitHub - FinTrack Dashboard

## 📋 Pré-requisitos

### 1. Instalar Git
1. Acesse [git-scm.com](https://git-scm.com/downloads)
2. Baixe a versão para Windows
3. Execute o instalador com as configurações padrão
4. Reinicie o terminal/PowerShell

### 2. Configurar Git (primeira vez)
```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@exemplo.com"
```

### 3. Criar Conta no GitHub
1. Acesse [github.com](https://github.com)
2. Clique em "Sign up"
3. Crie sua conta gratuita

## 🚀 Passos para Subir o Projeto

### Passo 1: Inicializar Git Local
```bash
# Navegar para a pasta do projeto
cd "C:\Users\rafae\Desktop\projeto 1\projeto"

# Inicializar repositório Git
git init

# Adicionar todos os arquivos
git add .

# Criar commit inicial
git commit -m "Initial commit - FinTrack Dashboard ready for Netlify"
```

### Passo 2: Criar Repositório no GitHub
1. Acesse [github.com](https://github.com)
2. Clique no botão **"+"** no canto superior direito
3. Selecione **"New repository"**
4. Preencha:
   - **Repository name:** `fintrack-dashboard`
   - **Description:** `Dashboard Financeiro FinTrack - Aplicativo Web e Mobile`
   - **Visibility:** Public (recomendado)
   - **NÃO** marque "Add a README file"
   - **NÃO** marque "Add .gitignore"
   - **NÃO** marque "Choose a license"
5. Clique em **"Create repository"**

### Passo 3: Conectar e Fazer Push
```bash
# Adicionar repositório remoto (substitua SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/fintrack-dashboard.git

# Renomear branch para main
git branch -M main

# Fazer push para o GitHub
git push -u origin main
```

## 🔐 Configuração de Autenticação

### Opção 1: Personal Access Token (Recomendado)
1. No GitHub, vá em **Settings > Developer settings > Personal access tokens > Tokens (classic)**
2. Clique em **"Generate new token"**
3. Selecione escopo **"repo"** (acesso completo)
4. Copie o token gerado
5. Use o token como senha quando solicitado

### Opção 2: GitHub CLI
```bash
# Instalar GitHub CLI
winget install GitHub.cli

# Fazer login
gh auth login

# Criar repositório e fazer push
gh repo create fintrack-dashboard --public --source=. --remote=origin --push
```

## 📁 Estrutura do Repositório

Após o push, seu repositório terá:
```
fintrack-dashboard/
├── src/                    # Código fonte
├── public/                 # Arquivos públicos
├── dist/                   # Build de produção
├── netlify.toml           # Configuração do Netlify
├── package.json           # Dependências
├── vite.config.ts         # Configuração do Vite
├── .gitignore            # Arquivos ignorados
├── README.md             # Documentação
├── DEPLOY.md             # Guia de deploy
└── NETLIFY-DEPLOY.md     # Guia específico do Netlify
```

## 🚨 Troubleshooting

### Erro de Autenticação
```bash
# Se der erro de autenticação, use token
git remote set-url origin https://SEU_TOKEN@github.com/SEU_USUARIO/fintrack-dashboard.git
```

### Erro de Branch
```bash
# Se der erro de branch
git branch -M main
git push -u origin main
```

### Arquivos Grandes
```bash
# Se houver arquivos muito grandes, adicione ao .gitignore
echo "node_modules/" >> .gitignore
echo "dist/" >> .gitignore
git add .gitignore
git commit -m "Update .gitignore"
```

## ✅ Verificação

Após o push, verifique:
1. **Repositório criado** no GitHub
2. **Todos os arquivos** estão presentes
3. **README.md** está visível
4. **Commits** aparecem no histórico

## 🎯 Próximos Passos

1. **Configurar Netlify** com o repositório GitHub
2. **Configurar variáveis** de ambiente
3. **Fazer deploy** automático
4. **Testar** o site em produção

---

**🎉 Parabéns! Seu projeto estará no GitHub e pronto para deploy!**
