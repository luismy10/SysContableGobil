const { currentDate, currentTime } = require('../tools/Tools');
const Conexion = require('../database/Conexion');
const conec = new Conexion();

class Cliente {

    async list(req) {
        try {
            let lista = await conec.query(`SELECT 
            c.idCliente ,
            td.nombre as tipodocumento,
            c.documento,
            c.informacion,
            c.celular,
            c.telefono,
            c.direccion,
            c.estado
            FROM cliente AS c
            INNER JOIN tipoDocumento AS td ON td.idTipoDocumento = c.idTipoDocumento
            WHERE 
            ? = 0
            OR
            ? = 1 and c.documento like concat(?,'%')
            OR
            ? = 1 and c.informacion like concat(?,'%')
            ORDER BY c.fecha DESC, c.hora DESC
            LIMIT ?,?`, [
                parseInt(req.query.opcion),

                parseInt(req.query.opcion),
                req.query.buscar,

                parseInt(req.query.opcion),
                req.query.buscar,

                parseInt(req.query.posicionPagina),
                parseInt(req.query.filasPorPagina)
            ])

            let resultLista = lista.map(function (item, index) {
                return {
                    ...item,
                    id: (index + 1) + parseInt(req.query.posicionPagina)
                }
            });

            let total = await conec.query(`SELECT COUNT(*) AS Total 
            FROM cliente AS c
            INNER JOIN tipoDocumento AS td ON td.idTipoDocumento = c.idTipoDocumento
            WHERE 
            ? = 0
            OR
            ? = 1 and c.documento like concat(?,'%')
            OR
            ? = 1 and c.informacion like concat(?,'%')`, [

                parseInt(req.query.opcion),

                parseInt(req.query.opcion),
                req.query.buscar,

                parseInt(req.query.opcion),
                req.query.buscar
            ]);

            return { "result": resultLista, "total": total[0].Total };
        } catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async add(req) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            let result = await conec.execute(connection, 'SELECT idCliente FROM cliente');
            let idCliente = "";
            if (result.length != 0) {

                let quitarValor = result.map(function (item) {
                    return parseInt(item.idCliente.replace("CL", ''));
                });

                let valorActual = Math.max(...quitarValor);
                let incremental = valorActual + 1;
                let codigoGenerado = "";
                if (incremental <= 9) {
                    codigoGenerado = 'CL000' + incremental;
                } else if (incremental >= 10 && incremental <= 99) {
                    codigoGenerado = 'CL00' + incremental;
                } else if (incremental >= 100 && incremental <= 999) {
                    codigoGenerado = 'CL0' + incremental;
                } else {
                    codigoGenerado = 'CL' + incremental;
                }

                idCliente = codigoGenerado;
            } else {
                idCliente = "CL0001";
            }

            await conec.execute(connection, `INSERT INTO cliente(
            idCliente, 
            idTipoDocumento,
            documento,
            informacion,
            celular,
            telefono,
            fechaNacimiento,
            email, 
            genero, 
            direccion,
            idUbigeo, 
            estadoCivil,
            estado, 
            observacion,
            fecha,
            hora,
            idUsuario)
            VALUES(?, ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
                idCliente,
                req.body.idTipoDocumento,
                req.body.documento,
                req.body.informacion,
                req.body.celular,
                req.body.telefono,
                req.body.fechaNacimiento,
                req.body.email,
                req.body.genero,
                req.body.direccion,
                req.body.idUbigeo,
                req.body.estadoCivil,
                req.body.estado,
                req.body.observacion,
                currentDate(),
                currentTime(),
                req.body.idUsuario,
            ])

            await conec.commit(connection);
            return "insert";
        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async id(req) {
        try {
            let result = await conec.query(`SELECT 
            cl.idCliente,
            cl.idTipoDocumento,
            cl.documento,
            cl.informacion,
            cl.celular,
            cl.telefono, 
            DATE_FORMAT(cl.fechaNacimiento,'%d/%m/%Y') as fecha,
            cl.email, 
            cl.genero,  
            cl.direccion,
            IFNULL(cl.idUbigeo,0) AS idUbigeo,
            IFNULL(u.ubigeo, '') AS ubigeo,
            IFNULL(u.departamento, '') AS departamento,
            IFNULL(u.provincia, '') AS provincia,
            IFNULL(u.distrito, '') AS distrito,
            cl.estadoCivil,
            cl.estado, 
            cl.observacion
            FROM cliente AS cl 
            LEFT JOIN ubigeo AS u ON u.idUbigeo = cl.idUbigeo
            WHERE 
            cl.idCliente = ?`, [
                req.query.idCliente,
            ]);

            if (result.length > 0) {
                return result[0];
            } else {
                return "Datos no encontrados";
            }
        } catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async update(req) {
        let connection = null;
        try {

            connection = await conec.beginTransaction();
            await conec.execute(connection, `UPDATE cliente SET
        idTipoDocumento=?, 
        documento=?,
        informacion=?, 
        celular=?,
        telefono=?,
        fechaNacimiento=?,
        email=?,
        genero=?, 
        direccion=?, 
        idUbigeo=?,
        estadoCivil=?, 
        estado=?,
        observacion=?,
        idUsuario=?
        WHERE idCliente=?`, [
                req.body.idTipoDocumento,
                req.body.documento,
                req.body.informacion,
                req.body.celular,
                req.body.telefono,
                req.body.fechaNacimiento,
                req.body.email,
                req.body.genero,
                req.body.direccion,
                req.body.idUbigeo,
                req.body.estadoCivil,
                req.body.estado,
                req.body.observacion,
                req.body.idUsuario,
                req.body.idCliente
            ])

            await conec.commit(connection)
            return "update";
        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async delete(req) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            let cobro = await conec.execute(connection, `SELECT * FROM cobro WHERE idCliente = ?`, [
                req.query.idCliente
            ]);

            if (cobro.length > 0) {
                await conec.rollback(connection);
                return 'No se puede eliminar el cliente ya que esta ligada a un cobro.';
            }

            let gasto = await conec.execute(connection, `SELECT * FROM gasto WHERE idCliente = ?`, [
                req.query.idCliente
            ]);

            if (gasto.length > 0) {
                await conec.rollback(connection);
                return 'No se puede eliminar el cliente ya que esta ligada a un gasto.';
            }

            let venta = await conec.execute(connection, `SELECT * FROM venta WHERE idCliente = ?`, [
                req.query.idCliente
            ]);

            if (venta.length > 0) {
                await conec.rollback(connection);
                return 'No se puede eliminar el cliente ya que esta ligada a una venta.';
            }

            await conec.execute(connection, `DELETE FROM cliente WHERE idCliente  = ?`, [
                req.query.idCliente
            ]);

            await conec.commit(connection);
            return "delete";
        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async listcombo(req) {
        try {
            let result = await conec.query('SELECT idCliente, documento, informacion FROM cliente');
            return result;
        } catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async listadeudas(req) {
        try {
            let lista = await conec.query(`SELECT 
            v.idVenta, 
            cl.documento, 
            cl.informacion, 
            v.numCuota, 
            (SELECT IFNULL(COUNT(*), 0) FROM plazo AS p WHERE p.estado = 0 AND p.fecha < CURRENT_DATE() AND p.idVenta = v.idVenta) AS cuotasRetrasadas,
            (SELECT IFNULL(COUNT(*), 0) FROM plazo AS p WHERE p.estado = 0 AND p.idVenta = v.idVenta) AS cuotasPendientes,
            (SELECT IFNULL(DATE_FORMAT(MIN(p.fecha),'%d/%m/%Y'),'') FROM plazo AS p WHERE p.estado = 0 AND p.idVenta = v.idVenta) AS fechaPago,
            m.simbolo,
            m.codiso,
            (SELECT IFNULL(SUM(p.monto),0) FROM plazo AS p WHERE p.estado = 0 AND p.fecha < CURRENT_DATE() AND p.idVenta = v.idVenta) AS montoPendiente,
            (SELECT IFNULL(MIN(p.monto),0) FROM plazo AS p WHERE p.estado = 0 AND p.idVenta = v.idVenta) AS montoActual
            FROM venta AS v 
            INNER JOIN moneda AS m ON m.idMoneda = v.idMoneda
            INNER JOIN comprobante AS cm ON v.idComprobante = cm.idComprobante 
            INNER JOIN cliente AS cl ON v.idCliente = cl.idCliente 
            LEFT JOIN ventaDetalle AS vd ON vd.idVenta = v.idVenta 
			WHERE v.estado = 2
            GROUP BY v.idVenta
            ORDER BY v.fecha ASC, v.hora ASC`, []);

            return lista;
        } catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async listapagos(req){
        try{           

            if(req.query.idCliente !== ""){
                let lista = await conec.query(`SELECT 
                c.idCobro, 
                co.nombre as comprobante,
                c.serie,
                c.numeracion,
                CASE 
                WHEN cn.idConcepto IS NOT NULL THEN cn.nombre
                ELSE CONCAT(cp.nombre,': ',v.serie,'-',v.numeracion) END AS detalle,
                m.simbolo,
                b.nombre as banco,  
                c.observacion, 
                DATE_FORMAT(c.fecha,'%d/%m/%Y') as fecha, 
                c.hora,
                IFNULL(SUM(cd.precio*cd.cantidad),SUM(cv.precio)) AS monto
                FROM cobro AS c
                INNER JOIN cliente AS cl ON c.idCliente = cl.idCliente
                INNER JOIN banco AS b ON c.idBanco = b.idBanco
                INNER JOIN moneda AS m ON c.idMoneda = m.idMoneda 
                INNER JOIN comprobante AS co ON co.idComprobante = c.idComprobante
                LEFT JOIN cobroDetalle AS cd ON c.idCobro = cd.idCobro
                LEFT JOIN concepto AS cn ON cd.idConcepto = cn.idConcepto 
                LEFT JOIN cobroVenta AS cv ON cv.idCobro = c.idCobro 
                LEFT JOIN venta AS v ON cv.idVenta = v.idVenta 
                LEFT JOIN comprobante AS cp ON v.idComprobante = cp.idComprobante
                WHERE c.idCliente = ?
                GROUP BY c.idCobro
                ORDER BY c.fecha DESC,c.hora DESC`,[
                    req.query.idCliente 
                ]);
    
                return lista;
            }else{
                let lista = await conec.query(`SELECT
                c.idCliente,
                c.documento,
                c.informacion,
                (SELECT IFNULL(SUM(cd.precio*cd.cantidad),0) FROM cobroDetalle AS cd WHERE cd.idCobro = co.idCobro) AS ingresos,
                (SELECT IFNULL(SUM(cv.precio),0) FROM cobroVenta AS cv WHERE cv.idCobro = co.idCobro) AS ventas
                FROM cobro AS co
                INNER JOIN cliente AS c ON c.idCliente = co.idCliente
                WHERE 
                co.fecha BETWEEN ? AND ?`,[
                    req.query.fechaIni,
                    req.query.fechaFin,
                    ,
                ]);
    
                return lista;
            }            
        }catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

}


module.exports = Cliente;