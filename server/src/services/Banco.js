const Conexion = require('../database/Conexion');
const conec = new Conexion();

class Banco {

    async detalleBanco(req) {
        try {

            let cabecera = await conec.query(`SELECT 
                b.idBanco,
                b.nombre, 
                CASE 
                WHEN b.tipoCuenta = 1 THEN 'Banco'
                WHEN b.tipoCuenta = 2 THEN 'Tarjeta'
                ELSE 'Efectivo' END AS 'tipoCuenta',
                m.nombre as moneda,
                m.codiso,
                b.numCuenta,
                b.cci,
                IFNULL(SUM(CASE WHEN bd.tipo = 1 THEN bd.monto ELSE -bd.monto END),0)AS saldo
                FROM banco AS b 
                INNER JOIN moneda AS m ON m.idMoneda = b.idMoneda 
                LEFT JOIN bancoDetalle AS bd ON bd.idBanco = b.idBanco 
                WHERE b.idBanco = ?`, [
                req.query.idBanco
            ])

            let lista = await conec.query(`SELECT 
            DATE_FORMAT(bd.fecha,'%d/%m/%Y') as fecha, 
            bd.hora,
            IFNULL(cl.informacion,IFNULL(cf.informacion,'')) AS proveedor,
            IFNULL(CONCAT(cc.nombre,' ',c.serie,'-',c.numeracion),
                   CONCAT(cg.nombre,' ',g.serie,'-',g.numeracion)) AS cuenta,
            bd.tipo,
            SUM(CASE WHEN bd.tipo = 1 THEN bd.monto ELSE 0 END ) AS ingreso,
            SUM(CASE WHEN bd.tipo = 0 THEN bd.monto ELSE 0 END ) AS salida
            FROM bancoDetalle AS bd 
            INNER JOIN banco AS b ON b.idBanco = bd.idBanco
            LEFT JOIN cobro AS c ON c.idCobro = bd.idProcedencia     
            LEFT JOIN cliente AS cl ON cl.idCliente = c.idCliente
            LEFT JOIN comprobante AS cc ON cc.idComprobante = c.idComprobante
            LEFT JOIN gasto AS g ON g.idGasto = bd.idProcedencia
            LEFT JOIN cliente AS cf ON cf.idCliente = g.idCliente
            LEFT JOIN comprobante AS cg ON cg.idComprobante = g.idComprobante
            
            WHERE bd.idBanco = ?
            GROUP BY bd.idBanco,bd.idProcedencia
            ORDER BY bd.fecha DESC,bd.hora DESC`, [
                req.query.idBanco
            ])

            return { "cabecera": cabecera[0], "lista": lista };

        } catch (error) {
            return 'Error interno de conexión, intente nuevamente.'
        }
    }

}

module.exports = Banco;