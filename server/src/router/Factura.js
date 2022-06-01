const express = require('express');
const router = express.Router();
const Factura = require('../services/Factura');
const Sede = require('../services/Sede');
const RepCuota = require('../report/RepCuota');
const RepFactura = require('../report/RepFactura');
const { decrypt } = require('../tools/CryptoJS');

const factura = new Factura();
const sede = new Sede();
const repCuota = new RepCuota();
const repFactura = new RepFactura();

router.get("/list", async function (req, res) {
    const result = await factura.list(req)
    if (typeof result === 'object') {
        res.status(200).send(result);
    } else {
        res.status(500).send(result);
    }
});

router.post("/add", async function (req, res) {
    const result = await factura.add(req)
    if (result === "insert") {
        res.status(200).send("Datos registrados correctamente");
    } else {
        res.status(500).send(result);
    }
});

router.delete("/anular", async function (req, res) {
    const result = await factura.anular(req)
    if (result === "anulado") {
        res.status(200).send("Se anulo correctamente la venta.");
    } else {
        res.status(500).send(result);
    }
});

router.get("/id", async function (req, res) {
    const result = await factura.dataId(req)
    if (typeof result === "object") {
        res.status(200).send(result);
    } else {
        res.status(500).send(result);
    }
});

router.get("/credito", async function (req, res) {
    const result = await factura.credito(req)
    if (typeof result === 'object') {
        res.status(200).send(result);
    } else {
        res.status(500).send(result);
    }
});

router.get("/credito/detalle", async function (req, res) {
    const result = await factura.detalleCredito(req)
    if (typeof result === 'object') {
        res.status(200).send(result);
    } else {
        res.status(500).send(result);
    }
});

router.get('/repcomprobante', async function (req, res) {
    const decryptedData = decrypt(req.query.params, 'key-report-inmobiliaria');
    req.query.idSede = decryptedData.idSede;
    req.query.idVenta = decryptedData.idVenta;

    const sedeInfo = await sede.infoSedeReporte(req)

    if (typeof sedeInfo !== 'object') {
        res.status(500).send(sedeInfo)
        return;
    }

    const detalle = await factura.dataId(req)

    if (typeof detalle === 'object') {

        let data = await repFactura.repComprobante(req, sedeInfo, detalle);

        if (typeof data === 'string') {
            res.status(500).send(data);
        } else {
            res.setHeader('Content-disposition', `inline; filename=${detalle.cabecera.comprobante + " " + detalle.cabecera.serie + "-" + detalle.cabecera.numeracion}.pdf`);
            res.contentType("application/pdf");
            res.send(data);
        }
    } else {
        res.status(500).send(detalle);
    }
})

router.get("/repcreditolote", async function (req, res) {
    const decryptedData = decrypt(req.query.params, 'key-report-inmobiliaria');
    req.query.idSede = decryptedData.idSede;
    req.query.idVenta = decryptedData.idVenta;
    req.query.proyecto = decryptedData.proyecto;

    const sedeInfo = await sede.infoSedeReporte(req)

    if (typeof sedeInfo !== 'object') {
        res.status(500).send(sedeInfo)
        return;
    }

    const detalle = await factura.detalleCredito(req);

    if (typeof detalle === 'object') {

        let data = await repCuota.repDetalleCuota(req, sedeInfo, detalle);

        if (typeof data === 'string') {
            res.status(500).send(data);
        } else {
            res.setHeader('Content-disposition', 'inline; filename=Cronograma de Pagos.pdf');
            res.contentType("application/pdf");
            res.send(data);
        }
    } else {
        res.status(500).send(detalle);
    }
});

router.get("/repgeneralventas", async function (req, res) {
    const decryptedData = decrypt(req.query.params, 'key-report-inmobiliaria');

    req.query.idSede = "SD0001";
    req.query.fechaIni = decryptedData.fechaIni;
    req.query.fechaFin = decryptedData.fechaFin;
    req.query.idComprobante = decryptedData.idComprobante;
    req.query.idCliente = decryptedData.idCliente;
    req.query.idUsuario = decryptedData.idUsuario;
    req.query.tipoVenta = decryptedData.tipoVenta;

    req.query.comprobante = decryptedData.comprobante;
    req.query.cliente = decryptedData.cliente;
    req.query.usuario = decryptedData.usuario;
    req.query.tipo = decryptedData.tipo;
   
    const sedeInfo = await sede.infoSedeReporte(req)

    if (typeof sedeInfo !== 'object') {
        res.status(500).send(sedeInfo)
        return;
    }

    const ventas = await factura.detalleVenta(req)

    if (Array.isArray(ventas)) {

        let data = await repFactura.repVentas(req, sedeInfo, ventas);

        if (typeof data === 'string') {
            res.status(500).send(data);
        } else {
            res.setHeader('Content-disposition', `inline; filename=REPORTE DE VENTAS DEL.pdf`);
            res.contentType("application/pdf");
            res.send(data);
        }
    } else {
        res.status(500).send(ventas);
    }

});

module.exports = router;