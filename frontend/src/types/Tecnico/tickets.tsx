export type departamentos = "Tecnologia" | "Recursos Humanos" | "TesoreriContabilidad" | "Administracion" | "Direccionrrollo"

export interface tickets {
    id: number
    departamentos: departamentos
    fecha_ticket: Date
}

