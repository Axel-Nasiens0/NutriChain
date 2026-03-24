use anchor_lang::prelude::*;

declare_id!("8Z6ufWoLeJ1txUQM3Z3zdf5amr374YWiEtReuVNjBpdT");

#[program]
pub mod nutri_chain {
    use super::*;

    // Inicializa el perfil del usuario/diario
    pub fn inicializar_diario(ctx: Context<InicializarDiario>) -> Result<()> {
        let diario = &mut ctx.accounts.diario;
        diario.usuario = ctx.accounts.usuario.key();
        diario.total_comidas = 0;
        diario.historial = Vec::new();
        msg!("¡Diario de NutriChain creado con éxito!");
        Ok(())
    }

    // Registra una nueva comida
    pub fn registrar_comida(
        ctx: Context<RegistrarComida>,
        tipo: String,        // Desayuno, Comida, Cena, Snack
        descripcion: String, 
        calorias: u16,       
        es_saludable: bool,  // Para los colores Verde/Rojo del frontend
        fecha: String        // DD/MM/AAAA
    ) -> Result<()> {
        let diario = &mut ctx.accounts.diario;
        
        let nueva_comida = Comida {
            tipo,
            descripcion,
            calorias,
            es_saludable,
            fecha,
        };

        diario.historial.push(nueva_comida);
        diario.total_comidas += 1;
        
        msg!("Comida registrada. ¡Sigue así!");
        Ok(())
    }
}

// --- ESTRUCTURAS DE DATOS ---

#[account]
#[derive(InitSpace)]
pub struct DiarioNutricion {
    pub usuario: Pubkey,
    pub total_comidas: u32,
    #[max_len(20)] // Guardaremos las últimas 20 comidas para no saturar el espacio
    pub historial: Vec<Comida>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, PartialEq, Debug)]
pub struct Comida {
    #[max_len(15)]
    pub tipo: String,
    #[max_len(40)]
    pub descripcion: String,
    pub calorias: u16,
    pub es_saludable: bool,
    #[max_len(12)]
    pub fecha: String,
}

// --- CONTEXTOS DE VALIDACIÓN ---

#[derive(Accounts)]
pub struct InicializarDiario<'info> {
    #[account(mut)]
    pub usuario: Signer<'info>,

    #[account(
        init,
        payer = usuario,
        space = 8 + DiarioNutricion::INIT_SPACE,
        seeds = [b"nutri-diario", usuario.key().as_ref()],
        bump
    )]
    pub diario: Account<'info, DiarioNutricion>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegistrarComida<'info> {
    #[account(mut)]
    pub usuario: Signer<'info>,
    
    #[account(
        mut,
        has_one = usuario, // Solo el dueño del diario puede registrar
        seeds = [b"nutri-diario", usuario.key().as_ref()],
        bump
    )]
    pub diario: Account<'info, DiarioNutricion>,
}
