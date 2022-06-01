const { currentDate, currentTime } = require('../tools/Tools');
const Conexion = require('../database/Conexion');
const conec = new Conexion();

class Factura {

    async list(req) {
        try {
            let lista = await conec.query(`SELECT 
                v.idVenta,
                c.idCliente,
                c.documento, 
                c.informacion,             
                v.idComprobante,  
                co.nombre as comprobante,
                v.serie,
                v.numeracion,
                DATE_FORMAT(v.fecha,'%d/%m/%Y') as fecha, 
                v.hora, 
                v.tipo, 
                v.estado,
                m.idMoneda,
                m.simbolo,
                IFNULL(SUM(vd.precio*vd.cantidad),0) AS total
                FROM venta AS v 
                INNER JOIN cliente AS c ON v.idCliente = c.idCliente
                INNER JOIN comprobante AS co ON v.idComprobante = co.idComprobante
                INNER JOIN moneda AS m ON v.idMoneda = m.idMoneda
                LEFT JOIN ventaDetalle AS vd ON vd.idVenta = v.idVenta
                WHERE 
                ? = 0 AND v.idProyecto = ?
                OR
                ? = 1 and c.informacion like concat(?,'%') AND v.idProyecto = ?
                OR
                ? = 1 and c.documento like concat(?,'%') AND v.idProyecto = ?
                GROUP BY v.idVenta
                ORDER BY v.fecha DESC, v.hora DESC
                LIMIT ?,?`, [
                parseInt(req.query.opcion),
                req.query.idProyecto,

                parseInt(req.query.opcion),
                req.query.buscar,
                req.query.idProyecto,

                parseInt(req.query.opcion),
                req.query.buscar,
                req.query.idProyecto,

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
                FROM venta AS v 
                INNER JOIN cliente AS c ON v.idCliente = c.idCliente
                INNER JOIN comprobante as co ON v.idComprobante = co.idComprobante
                INNER JOIN moneda AS m ON v.idMoneda = m.idMoneda
                WHERE 
                ? = 0 AND v.idProyecto = ?
                OR
                ? = 1 and c.informacion like concat(?,'%') AND v.idProyecto = ?
                OR
                ? = 1 and c.documento like concat(?,'%') AND v.idProyecto = ?`, [
                parseInt(req.query.opcion),
                req.query.idProyecto,

                parseInt(req.query.opcion),
                req.query.buscar,
                req.query.idProyecto,

                parseInt(req.query.opcion),
                req.query.buscar,
                req.query.idProyecto,
            ]);

            return { "result": resultLista, "total": total[0].Total }

        } catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async add(req) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            let countLote = 0;

            for (let item of req.body.detalleVenta) {
                let lote = await conec.execute(connection, `SELECT idLote FROM lote 
                    WHERE idLote = ? AND estado = 3`, [
                    item.idDetalle
                ]);
                if (lote.length > 0) {
                    countLote++;
                }
            }

            if (countLote > 0) {
                conec.rollback(connection);
                return "Hay un lote que se esta tratando de vender, no se puede continuar ya que está asociado a una factura."
            }

            let result = await conec.execute(connection, 'SELECT idVenta  FROM venta');
            let idVenta = "";
            if (result.length != 0) {

                let quitarValor = result.map(function (item) {
                    return parseInt(item.idVenta.replace("VT", ''));
                });

                let valorActual = Math.max(...quitarValor);
                let incremental = valorActual + 1;
                let codigoGenerado = "";
                if (incremental <= 9) {
                    codigoGenerado = 'VT000' + incremental;
                } else if (incremental >= 10 && incremental <= 99) {
                    codigoGenerado = 'VT00' + incremental;
                } else if (incremental >= 100 && incremental <= 999) {
                    codigoGenerado = 'VT0' + incremental;
                } else {
                    codigoGenerado = 'VT' + incremental;
                }

                idVenta = codigoGenerado;
            } else {
                idVenta = "VT0001";
            }

            let comprobante = await conec.execute(connection, `SELECT 
                serie,
                numeracion 
                FROM comprobante 
                WHERE idComprobante  = ?
                `, [
                req.body.idComprobante
            ]);

            let numeracion = 0;

            let ventas = await conec.execute(connection, 'SELECT numeracion  FROM venta WHERE idComprobante = ?', [
                req.body.idComprobante
            ]);

            if (ventas.length > 0) {
                let quitarValor = ventas.map(function (item) {
                    return parseInt(item.numeracion);
                });

                let valorActual = Math.max(...quitarValor);
                let incremental = valorActual + 1;
                numeracion = incremental;
            } else {
                numeracion = comprobante[0].numeracion;
            }

            await conec.execute(connection, `INSERT INTO venta(
                idVenta, 
                idCliente, 
                idUsuario, 
                idComprobante, 
                idProyecto,
                serie,
                numeracion,
                idMoneda,
                tipo, 
                numCuota,
                estado, 
                fecha, 
                hora)
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
                `, [
                idVenta,
                req.body.idCliente,
                req.body.idUsuario,
                req.body.idComprobante,
                req.body.idProyecto,
                comprobante[0].serie,
                numeracion,
                req.body.idMoneda,
                req.body.tipo,
                req.body.numCuota,
                req.body.estado,
                currentDate(),
                currentTime()
            ]);

            let montoTotal = 0;

            for (let item of req.body.detalleVenta) {
                await conec.execute(connection, `INSERT INTO ventaDetalle(
                    idVenta, 
                    idLote, 
                    precio, 
                    cantidad, 
                    idImpuesto)
                    VALUES(?,?,?,?,?)`, [
                    idVenta,
                    item.idDetalle,
                    parseFloat(item.precioContado),
                    item.cantidad,
                    item.idImpuesto,
                ]);

                await conec.execute(connection, `UPDATE lote SET estado = 3 WHERE idLote = ?`, [
                    item.idDetalle,
                ]);

                montoTotal += parseFloat(item.precioContado) * item.cantidad;
            }

            if (req.body.selectTipoPago) {
                let cobro = await conec.execute(connection, 'SELECT idCobro FROM cobro');
                let idCobro = "";
                if (cobro.length != 0) {

                    let quitarValor = cobro.map(function (item) {
                        return parseInt(item.idCobro.replace("CB", ''));
                    });

                    let valorActual = Math.max(...quitarValor);
                    let incremental = valorActual + 1;
                    let codigoGenerado = "";
                    if (incremental <= 9) {
                        codigoGenerado = 'CB000' + incremental;
                    } else if (incremental >= 10 && incremental <= 99) {
                        codigoGenerado = 'CB00' + incremental;
                    } else if (incremental >= 100 && incremental <= 999) {
                        codigoGenerado = 'CB0' + incremental;
                    } else {
                        codigoGenerado = 'CB' + incremental;
                    }

                    idCobro = codigoGenerado;
                } else {
                    idCobro = "CB0001";
                }

                let comprobanteCobro = await conec.execute(connection, `SELECT 
                serie,
                numeracion 
                FROM comprobante 
                WHERE idComprobante  = ?
                `, [
                    req.body.idComprobanteCobro
                ]);

                let numeracionCobro = 0;

                let cobros = await conec.execute(connection, 'SELECT numeracion  FROM cobro WHERE idComprobante = ?', [
                    req.body.idComprobanteCobro
                ]);

                if (cobros.length > 0) {
                    let quitarValor = cobros.map(function (item) {
                        return parseInt(item.numeracion);
                    });

                    let valorActual = Math.max(...quitarValor);
                    let incremental = valorActual + 1;
                    numeracionCobro = incremental;
                } else {
                    numeracionCobro = comprobanteCobro[0].numeracion;
                }

                await conec.execute(connection, `INSERT INTO cobro(
                idCobro, 
                idCliente, 
                idUsuario, 
                idMoneda, 
                idBanco, 
                idProcedencia,
                idProyecto,
                idComprobante,
                serie,
                numeracion,
                metodoPago, 
                estado, 
                observacion, 
                fecha, 
                hora) 
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
                    idCobro,
                    req.body.idCliente,
                    req.body.idUsuario,
                    req.body.idMoneda,
                    req.body.idBanco,
                    idVenta,
                    req.body.idProyecto,
                    req.body.idComprobanteCobro,
                    comprobanteCobro[0].serie,
                    numeracionCobro,
                    req.body.metodoPago,
                    1,
                    'INGRESO DEL PAGO TOTAL',
                    currentDate(),
                    currentTime()
                ]);

                await conec.execute(connection, `INSERT INTO cobroVenta(
                idCobro,
                idVenta,
                idPlazo,
                precio) 
                VALUES (?,?,?,?)`, [
                    idCobro,
                    idVenta,
                    0,
                    montoTotal
                ]);

                await conec.execute(connection, `INSERT INTO bancoDetalle(
                idBanco,
                idProcedencia,
                tipo,
                monto,
                fecha,
                hora,
                idUsuario)
                VALUES(?,?,?,?,?,?,?)`, [
                    req.body.idBanco,
                    idCobro,
                    1,
                    montoTotal,
                    currentDate(),
                    currentTime(),
                    req.body.idUsuario,
                ]);

            } else {
                if (req.body.montoInicialCheck) {
                    let cobro = await conec.execute(connection, 'SELECT idCobro FROM cobro');
                    let idCobro = "";
                    if (cobro.length != 0) {

                        let quitarValor = cobro.map(function (item) {
                            return parseInt(item.idCobro.replace("CB", ''));
                        });

                        let valorActual = Math.max(...quitarValor);
                        let incremental = valorActual + 1;
                        let codigoGenerado = "";
                        if (incremental <= 9) {
                            codigoGenerado = 'CB000' + incremental;
                        } else if (incremental >= 10 && incremental <= 99) {
                            codigoGenerado = 'CB00' + incremental;
                        } else if (incremental >= 100 && incremental <= 999) {
                            codigoGenerado = 'CB0' + incremental;
                        } else {
                            codigoGenerado = 'CB' + incremental;
                        }

                        idCobro = codigoGenerado;
                    } else {
                        idCobro = "CB0001";
                    }


                    let comprobanteCobro = await conec.execute(connection, `SELECT 
                    serie,
                    numeracion 
                    FROM comprobante 
                    WHERE idComprobante  = ?
                    `, [
                        req.body.idComprobanteCobro
                    ]);

                    let numeracionCobro = 0;

                    let cobros = await conec.execute(connection, 'SELECT numeracion  FROM cobro WHERE idComprobante = ?', [
                        req.body.idComprobanteCobro
                    ]);

                    if (cobros.length > 0) {
                        let quitarValor = cobros.map(function (item) {
                            return parseInt(item.numeracion);
                        });

                        let valorActual = Math.max(...quitarValor);
                        let incremental = valorActual + 1;
                        numeracionCobro = incremental;
                    } else {
                        numeracionCobro = comprobanteCobro[0].numeracion;
                    }

                    await conec.execute(connection, `INSERT INTO cobro(
                        idCobro, 
                        idCliente, 
                        idUsuario, 
                        idMoneda, 
                        idBanco, 
                        idProcedencia,
                        idProyecto,
                        idComprobante,
                        serie,
                        numeracion,
                        metodoPago, 
                        estado, 
                        observacion, 
                        fecha, 
                        hora) 
                        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
                        idCobro,
                        req.body.idCliente,
                        req.body.idUsuario,
                        req.body.idMoneda,
                        req.body.idBanco,
                        idVenta,
                        req.body.idProyecto,
                        req.body.idComprobanteCobro,
                        comprobanteCobro[0].serie,
                        numeracionCobro,
                        req.body.metodoPago,
                        1,
                        'INICIAL',
                        currentDate(),
                        currentTime()
                    ]);

                    await conec.execute(connection, `INSERT INTO cobroVenta(
                        idCobro,
                        idVenta,
                        idPlazo,
                        precio) 
                        VALUES (?,?,?,?)`, [
                        idCobro,
                        idVenta,
                        0,
                        req.body.inicial
                    ]);

                    await conec.execute(connection, `INSERT INTO bancoDetalle(
                        idBanco,
                        idProcedencia,
                        tipo,
                        monto,
                        fecha,
                        hora,
                        idUsuario)
                        VALUES(?,?,?,?,?,?,?)`, [
                        req.body.idBanco,
                        idCobro,
                        1,
                        req.body.inicial,
                        currentDate(),
                        currentTime(),
                        req.body.idUsuario,
                    ]);
                }

                let plazo = await conec.execute(connection, 'SELECT idPlazo FROM plazo');
                let idPlazo = 0;
                if (plazo.length != 0) {

                    let quitarValor = plazo.map(function (item) {
                        return parseInt(item.idPlazo);
                    });

                    let valorActual = Math.max(...quitarValor);
                    let incremental = valorActual + 1;
                    idPlazo = incremental;
                } else {
                    idPlazo = 1;
                }

                let inicioDate = new Date();

                let ultimoDate = new Date(inicioDate);
                ultimoDate.setMonth(ultimoDate.getMonth() + parseInt(req.body.numCuota));

                let cuotaMes = (montoTotal - req.body.inicial) / req.body.numCuota;
                while (inicioDate < ultimoDate) {
                    inicioDate.setMonth(inicioDate.getMonth() + 1);

                    await conec.execute(connection, `INSERT INTO plazo(
                        idPlazo,
                        idVenta,
                        fecha,
                        hora,
                        monto,
                        estado) 
                        VALUES(?,?,?,?,?,?)`, [
                        idPlazo,
                        idVenta,
                        inicioDate.getFullYear() + "-" + ((inicioDate.getMonth() + 1) < 10 ? "0" + (inicioDate.getMonth() + 1) : (inicioDate.getMonth() + 1)) + "-" + inicioDate.getDate(),
                        currentTime(),
                        cuotaMes,
                        0
                    ]);
                    idPlazo++;
                }
            }

            await conec.commit(connection);
            return "insert";
        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async anular(req) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            let vanta = await conec.execute(connection, `SELECT idVenta FROM venta 
                WHERE idVenta = ? AND estado = 3`, [
                req.query.idVenta
            ]);
            if (vanta.length !== 0) {
                await conec.rollback(connection);
                return "La venta ya se encuentra anulada."
            } else {
                let plazos = await conec.execute(connection, `SELECT * FROM
                    cobroVenta WHERE idVenta = ?`, [
                    req.query.idVenta
                ]);

                let validate = 0;

                for (let item of plazos) {
                    if (item.idPlazo !== 0) {
                        validate++;
                    }
                }

                if (validate > 0) {
                    await conec.rollback(connection);
                    return "No se puede eliminar la venta porque tiene cuotas asociadas."
                }

                await conec.execute(connection, `UPDATE venta SET estado = 3 
                    WHERE idVenta = ?`, [
                    req.query.idVenta
                ]);

                let cobro = await conec.execute(connection, `SELECT idCobro FROM cobro WHERE idProcedencia = ?`, [
                    req.query.idVenta
                ])

                if (cobro.length > 0) {
                    await conec.execute(connection, `DELETE FROM cobro WHERE idCobro = ?`, [
                        cobro[0].idCobro
                    ]);

                    await conec.execute(connection, `DELETE FROM cobroDetalle WHERE idCobro = ?`, [
                        cobro[0].idCobro
                    ]);

                    await conec.execute(connection, `DELETE FROM cobroVenta WHERE idCobro = ?`, [
                        cobro[0].idCobro
                    ]);

                    await conec.execute(connection, `DELETE FROM bancoDetalle WHERE idProcedencia  = ?`, [
                        cobro[0].idCobro
                    ]);
                }

                let lote = await conec.execute(connection, `SELECT vd.idLote FROM
                    venta AS v 
                    INNER JOIN ventaDetalle AS vd ON v.idVenta = vd.idVenta
                    WHERE v.idVenta  = ?`, [
                    req.query.idVenta
                ]);

                for (let item of lote) {
                    await conec.execute(connection, `UPDATE lote SET estado = 1 
                        WHERE idLote = ?`, [
                        item.idLote
                    ]);
                }

                await conec.execute(connection, `DELETE FROM plazo WHERE idVenta = ?`, [
                    req.query.idVenta
                ]);

                await conec.commit(connection);
                return "anulado";
            }
        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async dataId(req) {
        try {

            let result = await conec.query(`SELECT
            v.idVenta, 
            com.nombre AS comprobante,
            com.codigo as codigoVenta,
            v.serie,
            v.numeracion,
            
            td.nombre AS tipoDoc,      
            td.codigo AS codigoCliente,      
            c.documento,
            c.informacion,
            c.direccion,
    
            DATE_FORMAT(v.fecha,'%d/%m/%Y') as fecha,
            v.hora, 
            v.tipo, 
            v.estado, 
            m.simbolo,
            m.codiso,
            m.nombre as moneda,

            IFNULL(SUM(vd.precio*vd.cantidad),0) AS monto
            FROM venta AS v 
            INNER JOIN cliente AS c ON v.idCliente = c.idCliente
            INNER JOIN tipoDocumento AS td ON td.idTipoDocumento = c.idTipoDocumento 
            INNER JOIN comprobante AS com ON v.idComprobante = com.idComprobante
            INNER JOIN moneda AS m ON m.idMoneda = v.idMoneda
            LEFT JOIN ventaDetalle AS vd ON vd.idVenta = v.idVenta 
            WHERE v.idVenta = ?
            GROUP BY v.idVenta`, [
                req.query.idVenta
            ]);

            if (result.length > 0) {
                let detalle = await conec.query(`SELECT 
                l.descripcion AS lote,
                m.nombre AS manzana, 
                p.nombre AS proyecto,
                vd.precio,
                vd.cantidad,
                vd.idImpuesto,
                imp.nombre as impuesto,
                imp.porcentaje
                FROM ventaDetalle AS vd 
                INNER JOIN lote AS l ON vd.idLote = l.idLote 
                INNER JOIN manzana AS m ON l.idManzana = m.idManzana 
                INNER JOIN proyecto AS p ON m.idProyecto = p.idProyecto
                INNER JOIN impuesto AS imp ON vd.idImpuesto  = imp.idImpuesto 
                WHERE idVenta = ? `, [
                    req.query.idVenta
                ]);

                return { "cabecera": result[0], "detalle": detalle };
            } else {
                return "Datos no encontrados";
            }
        } catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async credito(req) {
        try {
            let lista = await conec.query(`SELECT 
            v.idVenta, 
            cl.idCliente,
            cl.documento, 
            cl.informacion, 
            cm.nombre, 
            v.serie, 
            v.numeracion, 
            (SELECT IFNULL(COUNT(*), 0) FROM plazo AS p WHERE p.estado = 0 AND p.idVenta = v.idVenta) AS numCuota, 
            (SELECT IFNULL(MIN(p.fecha),'') FROM plazo AS p WHERE p.estado = 0 AND p.idVenta = v.idVenta) AS fechaPago,
            v.fecha, 
            v.hora, 
            v.estado,
            m.idMoneda,
            m.simbolo,
            IFNULL(SUM(vd.precio*vd.cantidad),0) AS total,
            (SELECT IFNULL(SUM(cv.precio),0) FROM cobro AS c LEFT JOIN cobroVenta AS cv ON c.idCobro = cv.idCobro WHERE c.idProcedencia = v.idVenta ) AS cobrado 
            FROM venta AS v 
            INNER JOIN moneda AS m ON m.idMoneda = v.idMoneda
            INNER JOIN comprobante AS cm ON v.idComprobante = cm.idComprobante 
            INNER JOIN cliente AS cl ON v.idCliente = cl.idCliente 
            LEFT JOIN ventaDetalle AS vd ON vd.idVenta = v.idVenta 
            WHERE  
            ? = 0 AND v.estado = 2 AND v.idProyecto = ?
            OR
            ? = 1 and cl.informacion like concat(?,'%') AND v.estado = 2 AND v.idProyecto = ? 
            OR
            ? = 1 and cl.documento like concat(?,'%') AND v.estado = 2 AND v.idProyecto = ?
            GROUP BY v.idVenta
            ORDER BY v.fecha DESC, v.hora DESC
            LIMIT ?,?`, [
                parseInt(req.query.opcion),
                req.query.idProyecto,

                parseInt(req.query.opcion),
                req.query.buscar,
                req.query.idProyecto,

                parseInt(req.query.opcion),
                req.query.buscar,
                req.query.idProyecto,

                parseInt(req.query.posicionPagina),
                parseInt(req.query.filasPorPagina)
            ]);

            let resultLista = lista.map(function (item, index) {
                return {
                    ...item,
                    id: (index + 1) + parseInt(req.query.posicionPagina)
                }
            });

            let total = await conec.query(`SELECT COUNT(*) AS Total 
            FROM venta AS v 
            INNER JOIN moneda AS m ON m.idMoneda = v.idMoneda
            INNER JOIN comprobante AS cm ON v.idComprobante = cm.idComprobante 
            INNER JOIN cliente AS cl ON v.idCliente = cl.idCliente  
            WHERE  
            ? = 0 AND v.estado = 2 AND v.idProyecto = ?
            OR
            ? = 1 and cl.informacion like concat(?,'%') AND v.estado = 2 AND v.idProyecto = ?
            OR
            ? = 1 and cl.documento like concat(?,'%') AND v.estado = 2 AND v.idProyecto = ?`, [
                parseInt(req.query.opcion),
                req.query.idProyecto,

                parseInt(req.query.opcion),
                req.query.buscar,
                req.query.idProyecto,

                parseInt(req.query.opcion),
                req.query.buscar,
                req.query.idProyecto,
            ]);

            return { "result": resultLista, "total": total[0].Total }
        } catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async detalleCredito(req) {
        try {
            let venta = await conec.query(`
            SELECT 
            v.idVenta, 
            cl.idCliente,
            cl.documento, 
            cl.informacion, 
            cl.celular,
            cl.telefono,
            cl.email,
            cl.direccion,        
            cm.nombre, 
            v.serie, 
            v.numeracion, 
            v.numCuota, 
            (SELECT IFNULL(MIN(fecha),'') FROM plazo WHERE estado = 0) AS fechaPago,
            DATE_FORMAT(v.fecha,'%d/%m/%Y') as fecha, 
            v.hora, 
            v.estado,
            m.idMoneda,
            m.simbolo,
            IFNULL(SUM(vd.precio*vd.cantidad),0) AS total,
            (SELECT IFNULL(SUM(cv.precio),0) FROM cobro AS c LEFT JOIN cobroVenta AS cv ON c.idCobro = cv.idCobro WHERE c.idProcedencia = v.idVenta ) AS cobrado 
            FROM venta AS v 
            INNER JOIN moneda AS m ON m.idMoneda = v.idMoneda
            INNER JOIN comprobante AS cm ON v.idComprobante = cm.idComprobante 
            INNER JOIN cliente AS cl ON v.idCliente = cl.idCliente 
            LEFT JOIN ventaDetalle AS vd ON vd.idVenta = v.idVenta 
            WHERE  
            v.idVenta = ?
            GROUP BY v.idVenta
            `, [
                req.query.idVenta
            ]);

            let plazos = await conec.query(`SELECT 
            idPlazo,        
            DATE_FORMAT(fecha,'%d/%m/%Y') as fecha,
            monto,
            estado
            FROM plazo WHERE idVenta = ?
            `, [
                req.query.idVenta
            ]);

            let lotes = await conec.query(`SELECT
                l.descripcion AS lote,
                l.precio, 
                l.areaLote, 
                m.nombre AS manzana
                FROM venta AS v 
                INNER JOIN ventaDetalle AS vd ON v.idVenta = vd.idVenta
                INNER JOIN lote AS l ON vd.idLote = l.idLote
                INNER JOIN manzana AS m ON l.idManzana = m.idManzana
                WHERE v.idVenta = ?`, [
                req.query.idVenta
            ])

            let inicial = await conec.query(`SELECT 
                IFNULL( cv.precio, 0) AS inicial 
                FROM venta AS v 
                LEFT JOIN cobroVenta AS cv ON cv.idVenta = v.idVenta AND cv.idPlazo = 0
                WHERE v.idVenta = ?
                `, [req.query.idVenta])

            return { "venta": venta[0], "plazos": plazos, "lotes": lotes, "inicial": inicial[0].inicial }

        } catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }

    async detalleVenta(req) {
        try {
            let ventas = await conec.procedure(`CALL Listar_Ventas(?,?,?,?,?,?)`, [
                req.query.fechaIni,
                req.query.fechaFin,

                req.query.idComprobante,
                req.query.idCliente,
                req.query.idUsuario,
                req.query.tipoVenta,
            ]);

            return ventas;
        } catch (error) {
            return "Se produjo un error de servidor, intente nuevamente.";
        }
    }
}

module.exports = Factura;
