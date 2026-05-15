const baseUrl = 'https://facturapro.radiotecpro.com/api';

async function testProd() {
    console.log("1. Requesting OTP...");
    let res = await fetch(`${baseUrl}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            tenantName: 'Test Agency',
            name: 'Test Admin',
            email: 'admin.test@radiotecpro.com',
            phone: '5551234567',
            password: 'adminpassword'
        })
    });
    let data = await res.json();
    console.log("OTP Request:", res.status, data);
    const verificationId = data.verificationId;

    console.log("2. Verifying OTP (assuming 123456 works or bypassing)...");
    // Wait, I can't bypass OTP on prod! The OTP is sent via WhatsApp!
    // I can't register a new tenant without the OTP!
}

testProd().catch(console.error);
