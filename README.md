# 🚀 Producer-Consumer (RabbitMQ) - Entrega

**👤 Integrante**  

- JOÃO PEDRO MORI NOCE - RA: 00000000

## 📦 O que tem aqui

- **Producer**: Aplicação **Java Spring Boot** com endpoint `POST /api/messages` que publica mensagens na fila `messages` do RabbitMQ.  
  - O Producer é responsável por **gerar mensagens** e colocá-las na fila, sem se preocupar com o processamento final.  
  - Utiliza o protocolo **AMQP** para se comunicar com o RabbitMQ.

- **Consumer**: Aplicação **Node.js (Express)** que consome a fila `messages`, **armazena em MySQL** e expõe um endpoint `GET` para listar as mensagens.  
  - O Consumer **ouve a fila** e processa as mensagens conforme chegam, garantindo que nenhuma seja perdida.  
  - Isso implementa o padrão **Producer-Consumer**, separando produção e consumo de dados para escalabilidade e confiabilidade.

- **docker-compose.yml**: Orquestra RabbitMQ, MySQL e os dois serviços, facilitando o setup completo com **um único comando**.

---

## 🏗 Arquitetura das pastas

```text
project-consumer-rabbitmq/
│
├─ producer/                 # Aplicação Spring Boot
│  ├─ src/
│  │  └─ main/
│  │     ├─ java/com/example/
│  │     │  ├─ ProducerApplication.java  # Inicializa o Spring Boot
│  │     │  ├─ MessageController.java    # Endpoint POST /api/messages
│  │     │  └─ MessageDto.java           # DTO para mensagens
│  │     └─ resources/
│  │        └─ application.yml           # Configurações do RabbitMQ e porta
│  ├─ test/
│  ├─ target/                            # Build do Maven (jar)
│  ├─ Dockerfile                          # Para build da imagem Docker
│  └─ pom.xml
│
├─ consumer/                 # Aplicação Node.js
│  ├─ index.js                  # Conecta no RabbitMQ e MySQL
│  ├─ package.json
│  ├─ package-lock.json
│  └─ Dockerfile                  # Para build da imagem Docker
│
├─ docker-compose.yml        # Orquestração dos containers
└─ README.md
```

## ⚡ Como subir o ambiente

1. Clone ou copie a estrutura para um diretório local.

2. Abra o **PowerShell** ou **CMD** no diretório e execute:

```bash
docker-compose up --build -d
```

## 📝 O que esse comando faz

- `docker compose`: ferramenta que gerencia múltiplos containers de forma integrada.  
- `up`: sobe todos os serviços definidos no `docker-compose.yml`.  
- `--build`: força a reconstrução das imagens Docker antes de iniciar, garantindo que alterações recentes no código sejam aplicadas.  
- `-d`: roda os containers em segundo plano (detached mode), liberando o terminal.

Verifique se os containers estão rodando:

```bash
docker ps
```

Para parar o ambiente:
```bash
docker compose down
```

## 📤 Exemplo de envio de mensagem (Insomnia/Postman)

1. Abra o **Insomnia** ou **Postman**.
2. Crie uma requisição `POST` para o endpoint do **Producer**:

3. No corpo da requisição, envie um JSON como este:

- URL:
```text
POST http://localhost:8080/api/messages
```

- Headers:
```json
Content-Type: application/json
```

- Body:
```json
{
  "title": "Mensagem teste",
  "body": "Mensagem enviada pelo producer",
  "sender": "Aluno X"
}
```

- Exemplo de retorno esperado:
```json
{
  "status": "ENQUEUED",
  "queue": "messages"
}
```

## 🔧 Explicando tecnicamente o fluxo

1. **Producer envia mensagem** → RabbitMQ armazena na **fila `messages`**.  
2. **Consumer lê a fila** → processa e salva no **MySQL**.  
3. **Consumer disponibiliza via GET** → frontend ou outro serviço pode acessar as mensagens.

💡 **Benefício:**  
- O Producer e o Consumer podem escalar **independentemente**, garantindo que picos de produção de mensagens não sobrecarreguem o processamento.
