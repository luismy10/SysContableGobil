const path = require('path');
const PDFDocument = require("pdfkit-table");
const getStream = require('get-stream');
const { formatMoney, numberFormat } = require('../tools/Tools');

class RepCuota {

    async repDetalleCuota(req, sedeInfo, data) {
        const venta = data.venta;
        try {

            const doc = new PDFDocument({
                font: 'Helvetica',
                margins: {
                    top: 40,
                    bottom: 40,
                    left: 40,
                    right: 40
                }
            });

            doc.info["Title"] = "Cronograma de Pagos.pdf"

            let orgX = doc.x;
            let orgY = doc.y;
            let cabeceraY = orgY + 80;
            let titleX = orgX + 150;
            let medioX = doc.page.width / 2;

            let h1 = 13;
            let h2 = 11;
            let h3 = 9;

            doc.image(path.join(__dirname, "..", "path/to/logo.png"), orgX, orgY, { width: 75, });

            doc.fontSize(h1).text(
                `${sedeInfo.nombreEmpresa}`,
                titleX,
                orgY,
                {
                    width: 250,
                    align: "center"
                }
            );

            doc.fontSize(h3).text(
                `RUC: ${sedeInfo.ruc}\n${sedeInfo.direccion}\nCelular: ${sedeInfo.celular} / Telefono: ${sedeInfo.telefono}`,
                titleX,
                orgY + 17,
                {
                    width: 250,
                    align: "center",
                }
            );

            doc.fontSize(h2).text(
                `${req.query.proyecto}`,
                orgX,
                cabeceraY,
                {
                    width: 250,
                    align: "left",
                }
            );

            // doc.rect(
            //     orgX, 
            //     cabeceraY + 20,
            //     doc.page.width - doc.options.margins.left - doc.options.margins.right, 
            //     57).fillAndStroke('#eeeeee', '#eeeeee');

            // reset 
            doc.fill('#000').stroke('#000');

            doc.fontSize(h3).text(
                `Cliente: ${venta.informacion}\nMonto Total: ${numberFormat(venta.total)}\nMonto Cobrado: ${numberFormat(venta.cobrado)}\nMonto Restante: ${numberFormat(venta.total - venta.cobrado)}`,
                orgX,
                cabeceraY + 25
            );

            doc.fontSize(h3).text(
                `Dni/Ruc: ${venta.documento}\nMonto Inicial:  ${numberFormat(data.inicial)}\nN° Cuotas: ${venta.numCuota}\nComprobante: ${venta.nombre} ${venta.serie} - ${venta.numeracion}`,
                medioX,
                cabeceraY + 25
            );

            let lotes = data.lotes.map((item, index) => {
                return [++index, item.lote, numberFormat(item.precio), item.areaLote, item.manzana]
            })

            const lotesTabla = {
                // title: "CRONOGRAMA DE PAGOS MENSUALES VENTA AL CRÉDITO",
                subtitle: `LISTA DE LOTES ASOCIADOS A LA VENTA`,
                headers: ["N°", "LOTE", "PRECIO", "AREA m2", "MANZANA"],
                rows: lotes
            };

            doc.table(lotesTabla, {
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(h3),
                prepareRow: () => {
                    doc.font("Helvetica").fontSize(h3);
                },
                padding: 5,
                columnSpacing: 5,
                width: (doc.page.width - doc.options.margins.left - doc.options.margins.right),
                x: orgX,
                y: cabeceraY + 90,

            });

            let credito = venta.total - data.inicial
            let arrayIni = [0, '', '', numberFormat(credito), ''];

            let content = data.plazos.map((item, index) => {
                credito = credito - item.monto
                return [++index, item.fecha, item.estado === 1 ? 'COBRADO' : 'POR COBRAR', numberFormat(credito), numberFormat(item.monto)]
            })

            content.unshift(arrayIni)

            const table1 = {
                subtitle: "CRONOGRAMA DE PAGOS MENSUALES - VENTA AL CRÉDITO",
                headers: ["#", "FECHA DE PAGO", "ESTADO", "MONTO RESTANTE", "CUOTA MENSUAL"],
                rows: content
            };

            doc.table(table1, {
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(h3),
                prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                    if (indexColumn === 2) {
                        if (row[2] === "COBRADO") {
                            doc.font("Helvetica").fontSize(h3).fillColor("green");
                        }
                    } else {
                        doc.font("Helvetica").fontSize(h3).fillColor("black");
                    }

                },
                padding: 5,
                columnSpacing: 5,
                width: doc.page.width - doc.options.margins.left - doc.options.margins.right,
                x: orgX,
                y: doc.y + 10,
            });

            doc.end();
            return getStream.buffer(doc);
        } catch (error) {
            return "Se genero un error al generar el reporte.";
        }
    }

}

module.exports = RepCuota;