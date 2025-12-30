# **PROPOSED SOLUTION – DEEP DIVE ARCHITECTURE**

 

Client: Pegadaian

Project: Pricing Analytics (OCR \+ Forecasting)

Phase: PoC

 

**PoC objectives:**

• Prove the engine works

• Validate pricing logic

• Validate integration between services

• Buy-in from stakeholders

 

For this PoC, we intentionally abstract authentication and user management to focus on validating the core pricing and decision engines. The engine is designed to be stateless and IAM-agnostic, so it can later be seamlessly integrated with the company’s existing authentication infrastructure without refactoring.

 

**Executive Reasoning**

·       Engine \= value

·       Mock auth \= enough

·       IAM \= future phase

 

**Scope**

·       PoC for motorcycles

·       Doc verified by human before using the system (KTP, BPKB, STNK)

 **User Flow \- Engine**

**Step-by-step:**

1. User upload **dokumen SLIK & slip gaji**  
    **\-** Take photo atau upload dokumen (Fleksibel untuk web maupun mobile)  
    **\-** SLIK OJK dalam format PDF atau image (Dokumen nya satu format dan struktur)  
    **\-** Slip gaji dalam format PDF atau image (Dokumen nya beda format dan struktur)  
      
2. User upload **foto motor**  
    **\-** Take photo atau upload dokumen (Fleksibel untuk web maupun mobile)  
    **\-** Format image dalam jpg, jpeg, atau lainnya  
    **\-** Objek tampak depan, samping, belakang  
    **\-** Retake-tidak valid jika kualitas jelek (Case in real-time mobile)

 

3. Sistem proses **paralel**:  
   * Document OCR Service

     \-          Membaca informasi yang ada di SLIK dan/atau slip gaji

     \-          Output validasi dokumen OCR  
      Contoh UI:

     Data terdeteksi dari dokumen:

     1\.      Nama: Budi S\*

     2\.      Jenis Dokumen: SLIK OJK

     3\.      Status Kredit: Lancar (SLIK)

     4\.      Rentang Penghasilan: 7–10 juta / bulan

     5\.      Status Pekerjaan: Karyawan Tetap

      

   * Vehicle Vision Service

     \-          Identifikasi produk (automatic, editable)  
     	\* Type: Manual, matic, sport/off-road, vespa, trail, cruiser, listrik  
     	\* Make : Honda, Yamaha, Kawasaki, Suzuki,  
     	\* Model : Beat, Vario 160, Scoopy, Revo, CBR150, NMax  
      	\* Warna: Hitam, Putih, Merah, Biru, Hijau, Abu-abu, Pink, dll  
      	\* Nomor Plat 

      

     \-          Tahun motor (?) bisa dilihat dari STNK atau BPKB

     \-          Kondisi fisik (mulus, penyok, goresan, warna pudar, dll)  
      \* Additional: tambahkan kondisi fisik yang tidak tertangkap kamera  
      \* All fields are editable

      

4\.  	Pricing Engine

\-          Location input (automatic, editable)  
 \* UI Text Info: Estimasi harga untuk wilayah Jawa Barat  
 **\*** Bisa Ganti wilayah

\-          Estimasi harga di tahun saat pengambilan gambar dan wilayah tsb  
          \* Breakdown (edu & trust):  
		\- Base price (Current Market Value) \=\> olx, database  
		\- Condition adjustment (?) (asumsi)  
		\- Asset value (+ confidence level) 

5. Pawning Decision Engine   
    \* Fitur Bayar (beda logic)  
       	\- Gadai Kendaraan Reguler      
              	\- Gadai Kendaraan Harian  
    \* Tenor slider / input  
              	\- Reguler: 1-120 hari  
              	\- Harian: 1-60 hari  
   \* Real-time update:                                                          	  
           	   \- Nilai taksir gadai (depreciation not forecast)  
              	     \* UI: Nilai taksiran sudah memperhitungkan risiko penurunan nilai selama    periode gadai                                   	          	  
           	   \- Maksimal dana cair (calculation)  
              	   \- Sewa modal (berapa persen)  
              	   \- Jatuh Tempo (optional. Tergantung dari tanggal pemeriksaan dan tenor)

 

6. Export hasil Pricing Analytics

 

**System Architecture (Logical View)**

 

A.      Client Layer (Mobile/Web)

·       Upload dokumen (SLIK, slip gaji)

·       Upload foto motor

·       Input manual (fallback)

 

Output ke backend

 

{

  "vehicle\_image\_id": "IMG\_123",

  "documents": \["slik.pdf", "salary.pdf"\],

  "province": "Jawa Barat"

}

 

B.      API Gateway

C.      Core Engine  
 \- OCR Document  
 \- CV Vehicle

D.     Pricing Engine

E.      PawningEngine

F.       Export

 

 

 

Reference:

1\.      Gadai Motor di Pegadaian  
 source: [Sahabat Pegadaian](https://sahabat.pegadaian.co.id/artikel/keuangan/gadai-motor-di-pegadaian-ini-dia-caranya)

 **Langkah-langkah Gadai Motor di Pegadaian**

1. Datangi kantor Pegadaian terdekat dengan membawa motor dan dokumen persyaratan.  
2. Petugas akan menaksir nilai motor untuk menentukan besaran pinjaman. **(OUR POSITION)**  
3. Pilih produk Pegadaian yang sesuai: Gadai Kendaraan atau Pinjaman Non Emas dengan BPKB.  
4. Tandatangani akad pinjaman, lalu dana akan cair ke rekening atau tunai.  
5. Simpan bukti transaksi dengan baik untuk pelunasan.  
   

**Syarat Gadai Motor di Pegadaian**

Sebelum mengajukan gadai motor, ada beberapa syarat yang perlu kamu siapkan:

* Motor atas nama sendiri dan tidak dalam sengketa.  
* Membawa BPKB asli dan fotokopi.  
* Membawa STNK asli dan fotokopi.  
* Identitas diri (KTP asli dan fotokopi).  
* Usia kendaraan sesuai ketentuan:  
  * Motor roda dua maksimal 15 tahun.  
  * Kendaraan roda tiga maksimal 10 tahun.  
  * Kendaraan roda empat/lebih maksimal 20–25 tahun (tergantung plat)  
* Pinjaman mulai dari Rp1 juta

 

2\. Gadai Kendaraan  
 Source: [Sahabat Pegadaian](https://sahabat.pegadaian.co.id/produk-pegadaian/gadai-kendaraan#konvensional)

* Fotokopi KTP yang masih berlaku  
* STNK dan BPKB asli kendaraan  
* Kendaraan dalam kondisi layak pakai  
* Bukti keabsahan BPKB (cek fisik kendaraan dari Samsat jika diperlukan)  
* Jika kendaraan belum balik nama, wajib melampirkan Surat Pernyataan Belum Balik Nama dan Bukti Jual Beli

**Tarif Gadai Kendaraan (Motor)**

**Contoh Simulasi Pinjaman**

Uang Pinjaman: Rp7.500.000

Fitur Bayar: Reguler

Jangka Waktu: 30 Hari

Administrasi: Rp50.000