const express = require('express');
const router = express.Router();
const { decrypt } = require('../tools/CryptoJS');
const Sede = require('../services/Sede');
const Gasto = require('../services/Gasto');
const RepFinanciero = require('../report/RepFinanciero')
const RepFactura = require('../report/RepFactura');

const sede = new Sede();
const gasto = new Gasto();
const repFinanciero = new RepFinanciero();
const repFactura = new RepFactura();

router.get('/list', async function (req, res) {
    const result = await gasto.list(req)
    if (typeof result === 'object') {
        res.status(200).send(result);
    } else {
        res.status(500).send(result);
    }
});

router.post('/add', async function (req, res) {
    const result = await gasto.add(req)
    if (result === 'insert') {
        res.status(201).send("Se registró correctamente el gasto.");
    } else {
        res.status(500).send(result);
    }
});

router.get('/id', async function (req, res) {
    const result = await gasto.id(req)
    if (typeof result === 'object') {
        res.status(200).send(result);
    } else {
        res.status(500).send(result);
    }
});

router.delete('/anular', async function (req, res) {
    const result = await gasto.delete(req)
    if (result === 'delete') {
        res.status(201).send("Se eliminó correctamente el gasto.");
    } else {
        res.status(500).send(result);
    }
});

router.get('/repcomprobante', async function (req, res) {
    const decryptedData = decrypt(req.query.params, 'key-report-inmobiliaria');
    req.query.idSede = decryptedData.idSede;
    req.query.idGasto = decryptedData.idGasto;

    const sedeInfo = await sede.infoSedeReporte(req)

    if (typeof sedeInfo !== 'object') {
        res.status(500).send(sedeInfo)
        return;
    }

    const detalle = await gasto.id(req)

    if (typeof detalle === 'object') {

        let data = await repFactura.repGasto(req, sedeInfo, detalle);

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

module.exports = router;