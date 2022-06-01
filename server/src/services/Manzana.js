const Conexion = require('../database/Conexion');
const { currentDate, currentTime } = require('../tools/Tools');
const conec = new Conexion();

class Manzana {

    async list(req) {
        try {
            let lista = await conec.query(`SELECT 
            m.idManzana,
            m.nombre,
            p.nombre as proyecto,
            DATE_FORMAT(m.fecha,'%d/%m/%Y') as fecha,
            m.hora
            FROM manzana AS m INNER JOIN proyecto AS p
            ON m.idProyecto = p.idProyecto
            WHERE
            ? = 0 AND p.idProyecto = ?
            OR
            ? = 1 AND p.idProyecto = ? AND m.nombre LIKE CONCAT(?,'%')
            LIMIT ?,?`, [
                parseInt(req.query.opcion),
                req.query.idProyecto,

                parseInt(req.query.opcion),
                req.query.idProyecto,
                req.query.buscar,

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
            FROM manzana AS m INNER JOIN proyecto AS p
            ON m.idProyecto = p.idProyecto
            WHERE
            ? = 0 AND p.idProyecto = ?
            OR
            ? = 1 AND p.idProyecto = ? AND m.nombre LIKE CONCAT(?,'%')`, [
                parseInt(req.query.opcion),
                req.query.idProyecto,

                parseInt(req.query.opcion),
                req.query.idProyecto,
                req.query.buscar,
            ]);

            return { "result": resultLista, "total": total[0].Total };
        } catch (error) {
            return "Error interno de conexión, intente nuevamente.";
        }
    }

    async id(req) {
        try {
            let result = await conec.query('SELECT * FROM manzana WHERE idManzana = ?', [
                req.query.idManzana,
            ]);

            if (result.length > 0) {
                return result[0];
            } else {
                return "Datos no encontrados";
            }
        } catch (error) {
            return "Error interno de conexión, intente nuevamente.";
        }
    }

    async add(req) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            let result = await conec.execute(connection, 'SELECT idManzana FROM manzana');
            let idManzana = "";
            if (result.length != 0) {

                let quitarValor = result.map(function (item) {
                    return parseInt(item.idManzana.replace("MZ", ''));
                });

                let valorActual = Math.max(...quitarValor);
                let incremental = valorActual + 1;
                let codigoGenerado = "";
                if (incremental <= 9) {
                    codigoGenerado = 'MZ000' + incremental;
                } else if (incremental >= 10 && incremental <= 99) {
                    codigoGenerado = 'MZ00' + incremental;
                } else if (incremental >= 100 && incremental <= 999) {
                    codigoGenerado = 'MZ0' + incremental;
                } else {
                    codigoGenerado = 'MZ' + incremental;
                }

                idManzana = codigoGenerado;
            } else {
                idManzana = "MZ0001";
            }

            await conec.execute(connection, `INSERT INTO manzana(
            idManzana,
            nombre,
            idProyecto,
            fecha,
            hora,
            fupdate,
            hupdate,
            idUsuario) 
            VALUES(?,?,?,?,?,?,?,?)`, [
                idManzana,
                req.body.nombre,
                req.body.idProyecto,
                currentDate(),
                currentTime(),
                currentDate(),
                currentTime(),
                req.body.idUsuario,
            ])

            await conec.commit(connection);
            return 'insert';
        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return "Error interno de conexión, intente nuevamente.";
        }
    }

    async edit(req) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            await conec.execute(connection, `UPDATE manzana SET
            nombre = ?,
            idProyecto = ?,
            fupdate = ?,
            hupdate = ?,
            idUsuario = ?
            WHERE idManzana  = ?`, [
                req.body.nombre,
                req.body.idProyecto,
                currentDate(),
                currentTime(),
                req.body.idUsuario,
                req.body.idManzana
            ])

            await conec.commit(connection);
            return "update";
        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return "Error interno de conexión, intente nuevamente.";
        }
    }

    async delete(req) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            let lote = await conec.execute(connection, `SELECT * FROM lote WHERE idManzana = ?`, [
                req.query.idManzana
            ]);


            if (lote.length > 0) {
                await conec.rollback(connection);
                return "No se puede eliminar la manzana ya que esta ligada a un lote.";
            }

            await conec.execute(connection, `DELETE FROM manzana WHERE idManzana  = ?`, [
                req.query.idManzana
            ]);

            await conec.commit(connection)
            return "delete";
        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return "Error interno de conexión, intente nuevamente.";
        }
    }

    async listcombo(req) {
        try {
            let result = await conec.query('SELECT idManzana,nombre FROM manzana');
            return result;
        } catch (error) {
            return "Error interno de conexión, intente nuevamente.";
        }
    }

}

module.exports = Manzana;