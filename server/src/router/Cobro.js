const express = require('express');
const router = express.Router();
const { decrypt } = require('../tools/CryptoJS');
const Cobro = require('../services/Cobro');
const Sede = require('../services/Sede');
const RepFinanciero = require('../report/RepFinanciero');
const RepFactura = require('../report/RepFactura');

const sede = new Sede();
const cobro = new Cobro();
const repFinanciero = new RepFinanciero();
const repFactura = new RepFactura();

router.get('/list', async function (req, res) {
    const result = await cobro.list(req)
    if (typeof result === 'object') {
        res.status(200).send(result);
    } else {
        res.status(500).send(result);
    }
});

router.post('/add', async function (req, res) {
    const result = await cobro.add(req)
    if (result === 'insert') {
        res.status(201).send("Se registró correctamente el cobro.");
    } else {
        res.status(500).send(result);
    }
});

router.post('/cobro', async function (req, res) {
    const result = await cobro.cobro(req)
    if (result === 'insert') {
        res.status(201).send("Se registró correctamente el cobro.");
    } else {
        res.status(500).send(result);
    }
});

router.get('/id', async function (req, res) {
    const result = await cobro.id(req)
    if (typeof result === 'object') {
        res.status(200).send(result);
    } else {
        res.status(500).send(result);
    }
});

router.delete('/anular', async function (req, res) {
    const result = await cobro.delete(req)
    if (result === 'delete') {
        res.status(201).send("Se eliminó correctamente el cobro.");
    } else {
        res.status(500).send(result);
    }
});

router.get('/repcomprobante', async function (req, res) {
    const decryptedData = decrypt(req.query.params, 'key-report-inmobiliaria');
    req.query.idSede = decryptedData.idSede;
    req.query.idCobro = decryptedData.idCobro;


    const sedeInfo = await sede.infoSedeReporte(req)

    if (typeof sedeInfo !== 'object') {
        res.status(500).send(sedeInfo)
        return;
    }

    const detalle = await cobro.id(req)

    if (typeof detalle === 'object') {

        let data = await repFactura.repCobro(req, sedeInfo, detalle);

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
});

router.get('/repgeneralcobros', async function (req, res) {
    const decryptedData = decrypt(req.query.params, 'key-report-inmobiliaria');

    req.query.idSede = decryptedData.idSede;
    req.query.fechaIni = decryptedData.fechaIni;
    req.query.fechaFin = decryptedData.fechaFin;

    // req.query.idBanco = decryptedData.idBanco;
    // req.query.idCliente = decryptedData.idCliente;

    // req.query.banco = decryptedData.banco;
    // req.query.cliente = decryptedData.cliente;

    const sedeInfo = await sede.infoSedeReporte(req);

    if (typeof sedeInfo !== 'object') {
        res.status(500).send(sedeInfo);
        return;
    }

    const detalle = await cobro.cobroGeneral(req);

    if (typeof detalle === 'object') {
        let data = await repFinanciero.repFiltroCobros(req, sedeInfo, detalle);

        if (typeof data === 'string') {
            res.status(500).send(data);
        } else {
            res.setHeader('Content-disposition', `inline; filename=REPORTE DE COBROS Y GASTOS DEL ${req.query.fechaIni} AL ${req.query.fechaFin}.pdf`);
            res.contentType("application/pdf");
            res.send(data);
        }
    } else {
        res.status(500).send(detalle)
    }
});

module.exports = router;