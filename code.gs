function doGet()
{
  let bY = "Developed By Widhiawan Agung Kusumo (zhebom@gmail.com)";
  console.log(bY);
  return ContentService.createTextOutput(bY);
}

function doPost(e) {

  //==> alat test hilangkan e dalam dopost hilangkan // pada let e sampai kurung kurawal
  //  let e = {parameter : {
  // //  message:"daftar\nNama Proyek : Pembuatan Script Gemini\nNama Owner : Keyzhan Wafii Putra Kusumo\nNominal : 9300000\nTanggal : 21 Desember 2026\nUntuk Pembayaran : Lunas\nBukti Transaksi : Bank Jateng"
  //   message : "Jarvis buat total pemasukan bulan ini"
  //     }};
  

  let req = JSON.stringify(e).replace(/\\n/g, ":").replace("}\"", "}").replace("\"{", "{");
  //let req = JSON.stringify(e).replace(/\n.*?:/g, "\n");
  
  
  let reqJson = JSON.parse(req);
  //return console.log(reqJson);
  const gSheet = "https://docs.google.com/spreadsheets/d/1a08AoUTamKQL6hwUDveRkxeN0Jj3OR7bAxrNEJb1eZs/edit?usp=sharing";
  let senderMessage = JSON.stringify(reqJson["parameter"]["message"]);
  Logger.log("Perintah Masuk: "+ senderMessage );
 
 // ===== Function input google sheet ====//
function inputGsheet(senderMessage) {
  // Buka sheet
  let sheetUrl = "https://docs.google.com/spreadsheets/d/1a08AoUTamKQL6hwUDveRkxeN0Jj3OR7bAxrNEJb1eZs/edit?gid=162885518#gid=162885518";
  let file = SpreadsheetApp.openByUrl(sheetUrl);
  let sheet = file.getSheetByName("Sheet2");
  
   // Mengurai isi pesan
  //let parsedMessage = senderMessage.split("#");
  let parsedMessage = senderMessage
  .split(/[\r\n:]+/)             // Pisah berdasarkan enter atau titik dua
  .map(item => item.trim())    // Hapus spasi di awal/akhir setiap kata
  .filter(item => item !== ""); // Buang elemen yang kosong
  
  // ['"daftar', 'afin', '17/08/1945', 'Indonesia']
  let namaProyek = parsedMessage[2].trim();
  let namaOwner = parsedMessage[4].trim();
  let nominal = parsedMessage[6].trim();
  let tanggal = parsedMessage[8].trim();
let bayar = parsedMessage[10].trim();
let buktiTf = parsedMessage[12].trim().slice(0, -1);
  // Membuat ID
  let row = sheet.getLastRow() + 1;
  let prefixIdPendaftar = 220000;
  let idPendaftar = `A-${prefixIdPendaftar + row - 1}`;

  // Insert data
  sheet.getRange(`A${row}`).setValue(idPendaftar);
  sheet.getRange(`B${row}`).setValue(namaProyek);
  sheet.getRange(`C${row}`).setValue(namaOwner);
  sheet.getRange(`D${row}`).setValue(nominal);
  sheet.getRange(`E${row}`).setValue(tanggal);
 sheet.getRange(`F${row}`).setValue(bayar);
 sheet.getRange(`G${row}`).setValue(buktiTf);
  // Respon
  let response = 
    {
    
    "reply": `Terima kasih, Yth. ${namaOwner} berhasil terdaftar dengan ID ${idPendaftar}.`

  };
  
  let jsonResponse = JSON.stringify(response);
  return ContentService.createTextOutput(jsonResponse).setMimeType(ContentService.MimeType.JSON);
}

function convertSheetToJson() {
  // 1. Ambil spreadsheet yang aktif atau gunakan openByUrl('URL_SHEET_ANDA')
  const ss = SpreadsheetApp.openByUrl(gSheet);
  const sheet = ss.getActiveSheet();
  
  // 2. Ambil semua data dari sheet
  const data = sheet.getDataRange().getValues();
  
  // Jika sheet kosong, berhenti
  if (data.length === 0) return "Sheet kosong";

  // 3. Ambil baris pertama sebagai header (nama property JSON)
  const headers = data[0];
  const rows = data.slice(1); // Ambil data mulai dari baris kedua

  // 4. Konversi baris data menjadi format JSON (Object)
  const jsonArray = rows.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });

  // 5. Ubah array object menjadi string JSON yang rapi
  const jsonString = JSON.stringify(jsonArray, null, 2);
  
  return jsonString;
}

// 1. Validasi Prasyarat (Case-Insensitive)
  if (senderMessage.toLowerCase().includes("jarvis")) {
    Logger.log("Memanggil AI jarvis ...");
     return panggilGeminiRekap(senderMessage);
    
  }
    if (senderMessage.toLowerCase().includes("daftar")) {
    Logger.log("Validasi Prasyarat Daftar Succes")
    
   // Kerjakan Input ke Google Sheet
     return inputGsheet(senderMessage);
   
   // end input google sheet 
  }
  

function panggilGeminiRekap(senderMessage) {
 // return ContentService.createTextOutput("str");
 const apiKey = "UBAH API KEY GEMINI ANDA"; // Sebaiknya simpan di Project Settings > Script Properties
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  

  // 2. Persiapan Payload untuk API
  const payload = {
    "contents": [
      {
        "parts": [
          {
            "text": senderMessage + " "+ convertSheetToJson()
          }
        ]
      }
    ]
  };

 const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  // 3. Eksekusi Request





  try {
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
    //Logger.log(JSON.stringify(respone));
    //Logger.log(json);
    // Log hasil respons ke Logger Google Apps Script
    console.log("Generating JSON From Google Sheet ...");
    let rawReply = json.candidates[0].content.parts[0].text;

    let cleanReply = rawReply
      .replace(/\*/g, "")
      .replace(/#{1,6}\s?/g, "")
      .replace(/^\s+/gm, "")
      .trim();

    let respone = {
        "reply": cleanReply
    };

    
     Logger.log(JSON.stringify(respone));
    return ContentService.createTextOutput(JSON.stringify(respone)).setMimeType(ContentService.MimeType.JSON);
    
  } catch (e) {
    console.error("Terjadi kesalahan: " + e);
    return ContentService.createTextOutput("Terjadi Kesalahan :"+ e)
    
  }
}

// Fungsi untuk mengetes di editor Apps Script
function testScript(senderMessage) {
  //const input1 = "Tolong rekap data penjualan bulan ini.";
  let input2 = senderMessage;
  
 // Logger.log("Hasil 1: " + panggilGeminiRekap(input1));
  Logger.log("Hasil function testscript: "+ input2 );
  return ContentService.createTextOutput(input2)
  //return ContentService.createTextOutput("Hasil 2: " + str );

}
}
