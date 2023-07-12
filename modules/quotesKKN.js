import { url } from "../server.js"

const quotes = [
    "Selamat datang di hari pertama KKN!\n\nHari ini kita memulai petualangan baru dalam melayani masyarakat. Bersama-sama, mari kita berani, berkarya, dan berbagi kebaikan. Semangat, masih ada 29 hari lagi untuk menciptakan perubahan yang berarti!",
    "Selamat hari kedua KKN!\n\nMari terus bergandengan tangan dalam misi kita untuk membangun perubahan. Setiap tindakan kecil kita hari ini dapat membuat perbedaan besar bagi masyarakat sekitar. Jangan ragu untuk berinovasi dan berkolaborasi. Bersama, kita akan menggapai prestasi yang luar biasa!",
    "Tepat hari ini, kita sudah memasuki hari ketiga KKN.\n\nJangan biarkan semangat kita memudar! Sambutlah tantangan dengan senyuman dan keberanian. Jadilah teladan yang inspiratif bagi orang lain. Bersama-sama, kita akan mengubah dunia satu langkah kecil pada satu waktu.",
    "Hari keempat KKN telah tiba!\n\nWaktu berlalu begitu cepat, namun pengalaman yang kita dapatkan tak ternilai harganya. Teruslah mendengarkan cerita dan belajar dari masyarakat sekitar. Setiap harinya membawa pelajaran berharga. Jangan lupa untuk merayakan kemajuan yang telah kita capai!",
    "Selamat hari kelima KKN!\n\nSetengah perjalanan minggu ini sudah kita lewati, namun semangat dan energi kita tetap berkobar. Jadilah pendengar yang baik dan perhatikan kebutuhan masyarakat. Mari terus bergerak maju, menginspirasi, dan memberikan solusi bagi mereka yang membutuhkan.",
    "Hari keenam KKN, kita semakin dekat dengan tujuan kita.\n\nMelalui kolaborasi dan komunikasi yang baik, kita telah berhasil menjalankan berbagai proyek yang bermanfaat bagi masyarakat. Jangan lupa untuk merayakan setiap pencapaian kecil yang kita raih. Bersama, kita mampu melakukan hal-hal besar!",
    "Selamat hari ketujuh KKN!\n\nMomentum ini adalah waktu yang tepat untuk merefleksikan perjalanan kita selama seminggu ini. Melalui upaya bersama, kita telah memberikan kontribusi yang signifikan bagi masyarakat. Jangan pernah meremehkan kekuatan tim dan kebaikan yang dapat kita sebarkan di sekitar kita.",
    // "Hari kedelapan KKN telah tiba!\n\nMari kita tingkatkan komitmen kita dalam melayani masyarakat. Jangan takut mencoba hal-hal baru dan berinovasi untuk menghadapi tantangan yang ada. Tetap fokus pada tujuan kita dan bersikap gigih. Bersama, kita akan mencapai kesuksesan yang luar biasa!",
    "Hari kedelapan KKN!\n\nSelamat memasuki minggu ke-2 Kuliah Kerja Nyata wahai manusia, hati-hati rawan terjadi KKN (Kejebak Kenangan Nih)\n(kalau obot melihat situasi 7 hari terakhir sih, sepertinya pada kejebak kegabutan bukan kejebak kenangan). Semangat, masih ada 22 hari lagi untuk menciptakan perubahan yang berarti!!!",
    "Hari kesembilan KKN!\n\nSaatnya melangkah keluar dari zona nyaman dan mengambil langkah-langkah besar dalam memberikan dampak positif pada masyarakat. Jadikan setiap kesempatan sebagai peluang untuk berbagi pengetahuan, keterampilan, dan cinta kepada sesama. Mari terus bergerak maju!",
    "Selamat hari kesepuluh KKN!\n\nPada titik ini, kita telah menunjukkan ketekunan dan keberanian dalam melayani masyarakat. Jangan lupakan pentingnya menjaga semangat kita tetap menyala. Bersama-sama, kita telah melalui banyak hal dan masih ada banyak kebaikan yang akan kita ciptakan. Teruslah berjuang!",
    "Hari kesebelas KKN, kita telah melewati hampir dua minggu perjalanan ini.\n\nWaktu berlalu dengan cepat, tetapi dampak yang kita buat akan bertahan. Mari kita jaga semangat kita tetap berkobar dan terus berinovasi dalam memberikan solusi yang berkelanjutan bagi masyarakat sekitar.",
    "Selamat hari kedua belas KKN!\n\nPada titik ini, kita sudah mulai melihat hasil nyata dari upaya kita. Jangan biarkan kelelahan menghalangi langkah kita. Tetap fokus dan berdedikasi untuk melanjutkan pekerjaan baik kita. Bersama, kita sedang menciptakan perubahan yang berarti dalam kehidupan masyarakat.",
    "Hari ketiga belas KKN telah tiba!\n\nMomen ini adalah waktu yang tepat untuk merenung dan bersyukur atas pengalaman dan pelajaran berharga yang telah kita dapatkan. Teruslah menjaga semangat kolaborasi dan kebersamaan. Bersama, kita akan mencapai lebih banyak hal luar biasa dalam hari-hari mendatang.",
    "Selamat hari keempat belas KKN!\n\nHampir setengah perjalanan kita sudah dilalui, tetapi masih banyak lagi yang bisa kita capai. Jadikan momen ini sebagai titik balik untuk meningkatkan efektivitas dan dampak positif kita. Tetaplah berusaha dan jangan lupa untuk merayakan kemajuan yang telah kita raih.",
    "Hari kelima belas KKN telah tiba!\n\nWaktu berjalan dengan cepat ketika kita sibuk memberikan kontribusi kepada masyarakat. Lanjutkan upaya kita dengan semangat baru. Mari kita tetap terfokus pada tujuan kita dan bergerak maju dengan keyakinan. Bersama, kita mampu mengubah dunia.",
    "Selamat hari keenam belas KKN!\n\nPada titik ini, kita telah membentuk ikatan kuat dengan masyarakat dan memperoleh pemahaman yang lebih dalam tentang kebutuhan mereka. Jadikan setiap hari sebagai kesempatan untuk membawa perubahan yang positif dan menginspirasi orang-orang di sekitar kita.",
    "Hari ketujuh belas KKN telah tiba!\n\nWaktu berjalan begitu cepat, tetapi kerja keras kita tidak pernah berhenti. Teruslah melibatkan masyarakat dan mendengarkan suara mereka. Jangan lupa untuk merayakan pencapaian kita, karena setiap langkah kecil kita berkontribusi pada kehidupan yang lebih baik.",
    "Selamat hari kedelapan belas KKN!\n\nPada titik ini, kita telah membuktikan kekuatan kolaborasi dan keterlibatan kita. Teruslah menciptakan proyek-proyek yang bermanfaat dan memberikan solusi kreatif untuk memenuhi kebutuhan masyarakat. Bersama, kita adalah agen perubahan yang tak tergantikan.",
    "Hari kesembilan belas KKN telah tiba!\n\nInovasi dan keberanian kita membawa perubahan yang positif. Tetaplah menginspirasi orang-orang di sekitar kita melalui tindakan nyata. Jangan ragu untuk memanfaatkan sumber daya yang ada dan menciptakan dampak yang luar biasa. Bersama, kita akan mencapai lebih banyak lagi.",
    "Selamat hari kedua puluh KKN!\n\nPada titik ini, kita sudah merasakan kehangatan dan penerimaan dari masyarakat yang kita layani. Teruslah menjalin hubungan yang kuat dan memberikan yang terbaik bagi mereka. Jadikan setiap hari sebagai kesempatan untuk memberikan inspirasi dan membawa harapan kepada mereka yang membutuhkan.",
    "Hari kedua puluh satu KKN telah tiba!\n\nSaatnya untuk mengasah keterampilan kita lebih lanjut dan mencoba pendekatan baru dalam melayani masyarakat. Jangan berhenti berinovasi dan tetap terbuka terhadap peluang baru. Teruslah bergerak maju dengan semangat dan tekad yang tak tergoyahkan.",
    "Selamat hari kedua puluh dua KKN!\n\nPada titik ini, kita telah menjadi bagian tak terpisahkan dari masyarakat yang kita layani. Teruslah mendengarkan, berempati, dan bekerja sama dengan mereka untuk mencapai perubahan yang berarti. Bersama, kita mampu mengatasi segala tantangan yang ada di hadapan kita.",
    "Hari kedua puluh tiga KKN telah tiba!\n\nWaktu terus berjalan, tetapi semangat dan komitmen kita tidak boleh surut. Jangan biarkan kelelahan mengalahkan semangat kita. Mari kita beristirahat sejenak, mengevaluasi perjalanan kita, dan kembali dengan energi baru untuk mencapai sisa hari-hari KKN dengan sukses.",
    "Selamat hari kedua puluh empat KKN!\n\nPada titik ini, kita telah mengatasi berbagai rintangan dan tantangan. Tetaplah berfokus pada visi kita dan jangan ragu untuk meminta bantuan dan dukungan dari tim kita. Bersama-sama, kita mampu mengubah mimpi menjadi kenyataan.",
    "Hari kedua puluh lima KKN telah tiba!\n\nWaktunya untuk menggali lebih dalam lagi dalam pelayanan kita kepada masyarakat. Teruslah belajar dan berkembang, gunakan setiap pengalaman sebagai kesempatan untuk tumbuh dan berkontribusi lebih besar. Jangan pernah meremehkan kekuatan dan potensi kita untuk membuat perbedaan.",
    "Selamat hari kedua puluh enam KKN!\n\nSaat kita memasuki fase terakhir perjalanan kita, tetaplah berkomitmen untuk memberikan yang terbaik. Jangan lupakan nilai-nilai kebersamaan, kerjasama, dan kepedulian terhadap sesama. Bersama-sama, kita mampu mengubah dunia dengan satu tindakan kecil pada satu waktu.",
    "Hari kedua puluh tujuh KKN telah tiba!\n\nPada titik ini, kita telah membentuk ikatan yang kuat dengan masyarakat yang kita layani. Jadikan hubungan ini sebagai modal untuk menciptakan dampak positif yang lebih besar lagi. Teruslah berbagi pengetahuan, keahlian, dan cinta kepada mereka yang membutuhkan.",
    "Selamat hari kedua puluh delapan KKN!\n\nWaktu kita bersama masyarakat semakin dekat dengan akhir. Jangan biarkan kelelahan mengurangi semangat dan dedikasi kita. Tetaplah menginspirasi dan memberikan contoh yang baik melalui tindakan nyata kita. Bersama, kita mampu meninggalkan jejak perubahan yang tak terlupakan.",
    "Hari kedua puluh sembilan KKN telah tiba!\n\nSaat kita memasuki tahap akhir perjalanan ini, luangkan waktu untuk merenung dan menghargai segala pencapaian yang telah kita raih. Teruslah melibatkan masyarakat, menyelesaikan proyek-proyek dengan kualitas tinggi, dan memberikan dampak positif yang berkelanjutan.",
    "Hari terakhir KKN telah tiba.\n\nSaatnya kita melihat kembali perjalanan yang telah kita tempuh dengan bangga. Dari hari pertama hingga hari ini, kita telah belajar, bertumbuh, dan memberikan kontribusi nyata kepada masyarakat. Terima kasih untuk semangat dan dedikasi kalian semua. Ingatlah, perubahan yang kita mulai di sini akan terus menginspirasi dan memberikan dampak positif dalam kehidupan kita dan masyarakat.\n\nLanjutkanlah menjaga api semangat ini menyala!"
]

const tanggalAwalKKN = new Date("2023-07-04")

export function getTodayQuotesAsDcEmbed() {
    let today = new Date()
    let diff = today.getTime() - tanggalAwalKKN.getTime()
    let day = Math.floor(diff / (1000 * 3600 * 24))
    let quote = quotes[day]

    if (!quote) {
        return null
    }

    const embed = {
        type: "rich",
        title: `Hari ke-${day + 1} KKN`,
        description: `${quote}\n\n__#kknsemogasemakinmudah__\n__#kknuajy__`,
        color: 0x20c997,
        timestamp: new Date(),
        thumbnail: {
            url: `${url}/public/images/kknitumudah.jpg`
        },
        footer: {
            text: "JollyBOT using ChatGPT",
            icon_url: `${url}/public/images/logo.jpg`
        }
    }

    return embed
}