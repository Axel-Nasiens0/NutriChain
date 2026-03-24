// --- ⚙️ CONFIGURACIÓN DEL USUARIO ---
// Opciones: "REGISTRAR", "HISTORIAL", "RESUMEN"
const ACCION = "RESUMEN";

const NUEVA_COMIDA = {
  tipo: "Cena", // Desayuno, Almuerzo, Cena, Snack
  descripcion: "galletas",
  calorias: 79,
  esSaludable: true, // true = 🟢 | false = 🔴
  fecha: "22/03/2026",
};
// ------------------------------------

const [diarioPda] = web3.PublicKey.findProgramAddressSync(
  [Buffer.from("nutri-diario"), pg.wallet.publicKey.toBuffer()],
  pg.program.programId
);

async function ejecutarNutriChain() {
  console.log("--- 🥗 NutriChain: Registro de Salud en Solana ---");

  try {
    // 1. Verificar si el usuario tiene un diario, si no, crearlo
    try {
      await pg.program.account.diarioNutricion.fetch(diarioPda);
    } catch (e) {
      console.log("🆕 Creando tu diario nutricional por primera vez...");
      await pg.program.methods
        .inicializarDiario()
        .accounts({
          diario: diarioPda,
          usuario: pg.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      console.log("✅ Diario inicializado en la Blockchain.");
    }

    // 2. Ejecutar Acción Seleccionada
    if (ACCION === "REGISTRAR") {
      console.log(`Subiendo a Solana: ${NUEVA_COMIDA.descripcion}...`);
      const tx = await pg.program.methods
        .registrarComida(
          NUEVA_COMIDA.tipo,
          NUEVA_COMIDA.descripcion,
          NUEVA_COMIDA.calorias,
          NUEVA_COMIDA.esSaludable,
          NUEVA_COMIDA.fecha
        )
        .accounts({
          usuario: pg.wallet.publicKey,
          diario: diarioPda,
        })
        .rpc();
      console.log(`✅ Registro exitoso! TX: ${tx}`);
    } else if (ACCION === "HISTORIAL") {
      const data = await pg.program.account.diarioNutricion.fetch(diarioPda);
      console.log("\n📋 --- TU HISTORIAL INMUTABLE ---");

      data.historial.forEach((item, i) => {
        const color = item.esSaludable ? "🟢 SALUDABLE" : "🔴 COMIDA CHATARRA";
        console.log(
          `${i + 1}. [${item.fecha}] ${item.tipo}: ${item.descripcion}`
        );
        console.log(`   🔥 ${item.calorias} kcal | Estado: ${color}`);
        console.log("-------------------------------------------");
      });
    } else if (ACCION === "RESUMEN") {
      const data = await pg.program.account.diarioNutricion.fetch(diarioPda);
      const saludables = data.historial.filter((c) => c.esSaludable).length;
      const total = data.historial.length;

      console.log("\n📊 --- RESUMEN DE SALUD ---");
      console.log(`Total de comidas registradas: ${total}`);
      console.log(`Comidas saludables: ${saludables}`);

      if (saludables > total / 2) {
        console.log("🏆 ESTADO: ¡Comiste saludable hoy! Sigue así. 🔥");
      } else {
        console.log("⚠️ ESTADO: Podrías mejorar tu elección de alimentos. 💪");
      }
    }
  } catch (err) {
    console.error("❌ Error en NutriChain:", err.message);
  }
}

await ejecutarNutriChain();
