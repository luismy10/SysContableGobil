const express = require('express');
const router = express.Router();
const Lote = require('../services/Lote');
const Sede = require('../services/Sede');
const RepLote = require('../report/RepLote');
const { decrypt } = require('../tools/CryptoJS');
const { currentDate } = require('../tools/Tools')

const lote = new Lote();
const sede = new Sede();

const repLote = new RepLote();

router.get('/list', async function (req, res) {
    const result = await lote.listar(req)
    if (typeof result === 'object') {
        res.status(200).send(result)
    } else {
        res.status(500).send(result)
    }
})

router.post('/', async function (req, res) {
    const result = await lote.add(req)
    if (result === "insert") {
        res.status(200).send("Datos registrados correctamente")
    } else {
        res.status(500).send(result)
    }
});

router.get('/id', async function (req, res) {
    const result = await lote.dataId(req)
    if (typeof result === "object") {
        res.status(200).send(result)
    } else {
        res.status(500).send(result)
    }
});

router.put('/', async function (req, res) {
    const result = await lote.update(req)
    if (result === "update") {
        res.status(200).send("Los datos se actualizarón correctamente.");
    } else if (result === "noid") {
        res.status(400).send("Se genero un problema al tratar de obtener los datos.")
    } else {
        res.status(500).send(result)
    }
});

router.delete('/', async function (req, res) {
    const result = await lote.delete(req);
    if (result === "delete") {
        res.status(200).send("Se eliminó correctamente el lote.");
    } else {
        res.status(500).send(result)
    }
});

router.get('/detalle', async function (req, res) {
    const result = await lote.detalleLote(req)
    if (typeof result === 'object') {
        res.status(200).send(result)
    } else {
        res.status(500).send(result)
    }
});

router.get('/listcombo', async function (req, res) {
    const result = await lote.listarCombo(req)
    if (Array.isArray(result)) {
        res.status(200).send(result)
    } else {
        res.status(500).send(result)
    }
});

router.get('/lotecliente', async function (req, res) {
    const result = await lote.listarComboLoteCliente(req)
    if (Array.isArray(result)) {
        res.status(200).send(result)
    } else {
        res.status(500).send(result)
    }
})

router.get('/replotedetalle', async function (req, res) {
    const decryptedData = decrypt(req.query.params, 'key-report-inmobiliaria');
    req.query.idLote = decryptedData.idLote;
    req.query.idSede = decryptedData.idSede;

    const sedeInfo = await sede.infoSedeReporte(req)

    if (typeof sedeInfo !== 'object') {
        res.status(500).send(sedeInfo)
        return;
    }

    const detalle = await lote.detalleLote(req)

    if (typeof detalle === 'object') {

        let data = await repLote.repDetalleLote(sedeInfo, detalle)

        if (typeof data === 'string') {
            res.status(500).send(data)
        } else {
            res.setHeader('Content-disposition', 'inline; filename=Detalle del Lote.pdf');
            res.contentType("application/pdf");
            res.send(data);
        }
    } else {
        res.status(500).send(detalle)
    }
})

router.get('/reptipolotes', async function (req, res) {
    const decryptedData = decrypt(req.query.params, 'key-report-inmobiliaria');
    // req.query.idLote = decryptedData.idLote;
    req.query.estadoLote = decryptedData.estadoLote;
    req.query.idSede = decryptedData.idSede;
    req.query.idProyecto = decryptedData.idProyecto;

    const sedeInfo = await sede.infoSedeReporte(req)

    if (typeof sedeInfo !== 'object') {
        res.status(500).send(sedeInfo)
        return;
    }

    const detalle = await lote.listaEstadoLote(req)

    if (typeof detalle === 'object') {

        let data = await repLote.repTipoLote(req, sedeInfo, detalle)

        if (typeof data === 'string') {
            res.status(500).send(data)
        } else {
            res.setHeader('Content-disposition', `inline; filename=DETALLE DE LOTES AL ${currentDate()}.pdf`);
            res.contentType("application/pdf");
            res.send(data);
        }
    } else {
        res.status(500).send(detalle);
    }
})

module.exports = router;