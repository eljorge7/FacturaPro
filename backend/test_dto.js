const { validate } = require('class-validator');
const { plainToInstance } = require('class-transformer');
const { CreateQuoteDto } = require('./dist/quotes/dto/create-quote.dto.js');

async function run() {
  const payload = {
    customerId: "some-customer-id",
    isProposal: true,
    projectName: "",
    projectScope: "Llave en mano",
    items: [
      {
        description: "Sistema de Comunicación",
        type: "SECTION_HEADER",
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        taxRate: 0.16,
        total: 0,
        orderIndex: 0
      },
      {
        productId: "some-prod-id",
        description: "Repetidor VHF",
        type: "ITEM",
        quantity: 1,
        unitPrice: 43000,
        discount: 0,
        taxRate: 0.16,
        total: 43000,
        orderIndex: 1
      }
    ]
  };

  const dtoObj = plainToInstance(CreateQuoteDto, payload);
  const errors = await validate(dtoObj, { whitelist: true, forbidNonWhitelisted: true });
  console.log("Validation errors:");
  console.log(JSON.stringify(errors, null, 2));
}

run().catch(console.error);
