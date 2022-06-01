const Conexion = require('../database/Conexion');
const conec = new Conexion();

class Sede {

    async listar(req) {
        try {
            let lista = await conec.query(`SELECT 
                idSede, ruc, razonSocial, nombreEmpresa, nombreSede, direccion, celular, telefono, email, web
                FROM sede 
                WHERE 
                ? = 0
                OR
                ? = 1 and nombreSede like concat(?,'%')
                LIMIT ?,?`, [
                parseInt(req.query.opcion),

                parseInt(req.query.opcion),
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

            let total = await conec.query(`SELECT COUNT(*) AS Total FROM sede
            where  
            ? = 0
            OR
            ? = 1 and nombreSede like concat(?,'%')`, [
                parseInt(req.query.opcion),

                parseInt(req.query.opcion),
                req.query.buscar,
            ]);

            return { "result": resultLista, "total": total[0].Total };
        } catch (error) {
            return "Error interno de conexión, intente nuevamente.";
        }
    }

    async add(req) {
        let connection = null;
        try {
            connection = await conec.beginTransaction();

            let result = await conec.execute(connection, 'SELECT idSede FROM sede');
            let idSede = "";
            if (result.length != 0) {

                let quitarValor = result.map(function (item) {
                    return parseInt(item.idSede.replace("SD", ''));
                });

                let valorActual = Math.max(...quitarValor);
                let incremental = valorActual + 1;
                let codigoGenerado = "";
                if (incremental <= 9) {
                    codigoGenerado = 'SD000' + incremental;
                } else if (incremental >= 10 && incremental <= 99) {
                    codigoGenerado = 'SD00' + incremental;
                } else if (incremental >= 100 && incremental <= 999) {
                    codigoGenerado = 'SD0' + incremental;
                } else {
                    codigoGenerado = 'SD' + incremental;
                }

                idSede = codigoGenerado;
            } else {
                idSede = "SD0001";
            }

            await conec.execute(connection, `INSERT INTO sede (
            idSede,
            ruc,
            razonSocial,
            nombreEmpresa,
            nombreSede,
            direccion,
            idUbigeo,

            celular,
            telefono,
            email,
            web,
            descripcion,
            useSol,
            claveSol,
            certificado,
            claveCert,

            imagen,
            extension) values (?,?,?,?,?,?,?, ?,?,?,?,?,?,?,?,?, ?,?)`, [
                idSede,
                req.body.ruc,
                req.body.razonSocial,
                req.body.nombreEmpresa,
                req.body.nombreSede,
                req.body.direccion,
                req.body.idUbigeo,

                req.body.celular,
                req.body.telefono,
                req.body.email,
                req.body.web,
                req.body.descripcion,
                req.body.useSol,
                req.body.claveSol,
                req.body.certificado,
                req.body.claveCert,

                req.body.imagen,
                req.body.extension
            ]);

            await conec.commit(connection);
            return "insert";
        } catch (err) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return 'Error interno de conexión, intente nuevamente.';
        }
    }

    async dataId(req) {
        try {
            let result = await conec.query(`SELECT 
                s.idSede,
                s.ruc,
                s.razonSocial,
                s.nombreEmpresa,
                s.nombreSede,
                s.direccion,
    
                s.idUbigeo,
                u.ubigeo,
                u.departamento,
                u.provincia,
                u.distrito,
    
                s.celular,
                s.telefono,
                s.email,
                s.web,
                s.descripcion,
                s.useSol,
                s.claveSol,
                s.certificado,
                s.claveCert,
    
                s.imagen,
                s.extension
    
                FROM sede AS s
                INNER JOIN ubigeo AS u ON s.idUbigeo = u.idUbigeo
                WHERE s.idSede = ?`, [
                req.query.idSede,
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

    async update(req) {
        let connection = null;
        try {

            connection = await conec.beginTransaction();
            await conec.execute(connection, `UPDATE sede SET 
            ruc=?,
            razonSocial=?,
            nombreEmpresa=?,
            nombreSede=?,
            direccion=?,
            idUbigeo=?,

            celular=?,
            telefono=?,
            email=?,
            web=?,
            descripcion=?,
            useSol=?,
            claveSol=?,
            certificado=?,
            claveCert=?,

            imagen=?,
            extension=?
            WHERE idSede = ?`, [
                req.body.ruc,
                req.body.razonSocial,
                req.body.nombreEmpresa,
                req.body.nombreSede,
                req.body.direccion,
                req.body.idUbigeo,

                req.body.celular,
                req.body.telefono,
                req.body.email,
                req.body.web,
                req.body.descripcion,
                req.body.useSol,
                req.body.claveSol,
                req.body.certificado,
                req.body.claveCert,

                req.body.imagen,
                req.body.extension,
                req.body.idSede
            ]);

            await conec.commit(connection);
            return "update";
        } catch (error) {
            if (connection != null) {
                await conec.rollback(connection);
            }
            return "Error interno de conexión, intente nuevamente.";
        }
    }

    async listarCombo(req) {
        try {
            let result = await conec.query('SELECT idSede,nombreSede FROM sede');
            return result;
        } catch (error) {
            return "Error interno de conexión, intente nuevamente."
        }
    }

    async infoSedeReporte(req) {
        try {
            let result = await conec.query(`SELECT 
                idSede, ruc, razonSocial, nombreEmpresa, nombreSede, direccion, celular, telefono, email, web
                FROM sede WHERE idSede = ?`, [
                req.query.idSede,
            ]);

            if (result.length > 0) {
                return result[0];
            } else {
                return "Datos no encontrados";
            }
        } catch (error) {
            console.log(error);
            return 'Error interno de conexión, intente nuevamente.';
        }
    }

}

module.exports = Sede