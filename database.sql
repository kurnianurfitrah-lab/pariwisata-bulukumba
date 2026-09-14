-- Canonical schema for MySQL 8.0.16+.
-- Existing installations should use `cd backend && npm run migrate`.

CREATE DATABASE IF NOT EXISTS bulukumba_tourism_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE bulukumba_tourism_db;

CREATE TABLE IF NOT EXISTS admin (
    id_admin INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS kategori (
    id_kategori INT AUTO_INCREMENT PRIMARY KEY,
    nama_kategori VARCHAR(150) NOT NULL,
    entity_type ENUM('wisata', 'hotel', 'restoran') NOT NULL,
    deskripsi TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_kategori_entity_name (entity_type, nama_kategori)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wisata (
    id_wisata INT AUTO_INCREMENT PRIMARY KEY,
    id_kategori INT NOT NULL,
    nama_wisata VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    harga_tiket VARCHAR(100),
    jam_operasional VARCHAR(100),
    fasilitas TEXT,
    peta_wisata TEXT,
    keterangan TEXT,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_wisata_id_kategori (id_kategori),
    CONSTRAINT fk_wisata_kategori FOREIGN KEY (id_kategori)
        REFERENCES kategori(id_kategori)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hotel (
    id_hotel INT AUTO_INCREMENT PRIMARY KEY,
    id_kategori INT NOT NULL,
    nama_hotel VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    harga_kamar VARCHAR(100),
    alamat_hotel TEXT,
    nomor_telepon VARCHAR(50),
    website VARCHAR(255),
    fasilitas TEXT,
    peta_hotel TEXT,
    keterangan TEXT,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_hotel_id_kategori (id_kategori),
    CONSTRAINT fk_hotel_kategori FOREIGN KEY (id_kategori)
        REFERENCES kategori(id_kategori)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS restoran (
    id_restoran INT AUTO_INCREMENT PRIMARY KEY,
    id_kategori INT NOT NULL,
    nama_restoran VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    harga_rata_rata VARCHAR(100),
    jam_operasional VARCHAR(100),
    alamat_restoran TEXT,
    nomor_telepon VARCHAR(50),
    website VARCHAR(255),
    menu_unggulan TEXT,
    peta_restoran TEXT,
    keterangan TEXT,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_restoran_id_kategori (id_kategori),
    CONSTRAINT fk_restoran_kategori FOREIGN KEY (id_kategori)
        REFERENCES kategori(id_kategori)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `event` (
    id_event INT AUTO_INCREMENT PRIMARY KEY,
    nama_event VARCHAR(255) NOT NULL,
    deskripsi_event TEXT,
    tempat VARCHAR(255),
    tanggal_mulai DATE,
    tanggal_selesai DATE,
    gambar_event VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS galeri (
    id_galeri INT AUTO_INCREMENT PRIMARY KEY,
    id_wisata INT DEFAULT NULL,
    id_hotel INT DEFAULT NULL,
    id_restoran INT DEFAULT NULL,
    gambar VARCHAR(500) NOT NULL,
    keterangan TEXT DEFAULT NULL,
    nama VARCHAR(200) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_galeri_id_wisata (id_wisata),
    KEY idx_galeri_id_hotel (id_hotel),
    KEY idx_galeri_id_restoran (id_restoran),
    CONSTRAINT fk_galeri_wisata FOREIGN KEY (id_wisata)
        REFERENCES wisata(id_wisata) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_galeri_hotel FOREIGN KEY (id_hotel)
        REFERENCES hotel(id_hotel) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_galeri_restoran FOREIGN KEY (id_restoran)
        REFERENCES restoran(id_restoran) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS review (
    id_review INT AUTO_INCREMENT PRIMARY KEY,
    id_wisata INT DEFAULT NULL,
    id_hotel INT DEFAULT NULL,
    id_restoran INT DEFAULT NULL,
    nama_reviewer VARCHAR(150) NOT NULL,
    email_reviewer VARCHAR(255) DEFAULT NULL,
    rating DECIMAL(2,1) NOT NULL,
    komentar TEXT DEFAULT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_review_id_wisata (id_wisata),
    KEY idx_review_id_hotel (id_hotel),
    KEY idx_review_id_restoran (id_restoran),
    KEY idx_review_status (status),
    KEY idx_review_created_at (created_at),
    CONSTRAINT fk_review_wisata FOREIGN KEY (id_wisata)
        REFERENCES wisata(id_wisata) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_review_hotel FOREIGN KEY (id_hotel)
        REFERENCES hotel(id_hotel) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_review_restoran FOREIGN KEY (id_restoran)
        REFERENCES restoran(id_restoran) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_review_rating CHECK (
        rating BETWEEN 1.0 AND 5.0 AND MOD(rating * 10, 5) = 0
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TRIGGER IF EXISTS trg_galeri_single_entity_insert;
DROP TRIGGER IF EXISTS trg_galeri_single_entity_update;
DROP TRIGGER IF EXISTS trg_review_single_entity_insert;
DROP TRIGGER IF EXISTS trg_review_single_entity_update;

DELIMITER //
CREATE TRIGGER trg_galeri_single_entity_insert
BEFORE INSERT ON galeri
FOR EACH ROW
BEGIN
    IF ((NEW.id_wisata IS NOT NULL) + (NEW.id_hotel IS NOT NULL) + (NEW.id_restoran IS NOT NULL)) <> 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Exactly one entity reference is required';
    END IF;
END//

CREATE TRIGGER trg_galeri_single_entity_update
BEFORE UPDATE ON galeri
FOR EACH ROW
BEGIN
    IF ((NEW.id_wisata IS NOT NULL) + (NEW.id_hotel IS NOT NULL) + (NEW.id_restoran IS NOT NULL)) <> 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Exactly one entity reference is required';
    END IF;
END//

CREATE TRIGGER trg_review_single_entity_insert
BEFORE INSERT ON review
FOR EACH ROW
BEGIN
    IF ((NEW.id_wisata IS NOT NULL) + (NEW.id_hotel IS NOT NULL) + (NEW.id_restoran IS NOT NULL)) <> 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Exactly one entity reference is required';
    END IF;
END//

CREATE TRIGGER trg_review_single_entity_update
BEFORE UPDATE ON review
FOR EACH ROW
BEGIN
    IF ((NEW.id_wisata IS NOT NULL) + (NEW.id_hotel IS NOT NULL) + (NEW.id_restoran IS NOT NULL)) <> 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Exactly one entity reference is required';
    END IF;
END//
DELIMITER ;

INSERT IGNORE INTO kategori (nama_kategori, entity_type, deskripsi) VALUES
    ('Pantai', 'wisata', 'Destinasi wisata pantai dan pesisir.'),
    ('Pulau', 'wisata', 'Destinasi pulau dan kawasan bahari.'),
    ('Air Terjun', 'wisata', 'Destinasi air terjun dan aliran sungai alami.'),
    ('Bukit & Panorama', 'wisata', 'Destinasi bukit, puncak, dan titik panorama.'),
    ('Wisata Budaya & Sejarah', 'wisata', 'Destinasi budaya lokal, cagar sejarah, dan warisan tradisi.'),
    ('Wisata Religi', 'wisata', 'Destinasi religi, ziarah, dan situs keagamaan.'),
    ('Ekowisata & Alam', 'wisata', 'Destinasi konservasi, alam terbuka, dan ekowisata.'),
    ('Wisata Keluarga & Rekreasi', 'wisata', 'Destinasi santai, rekreasi, dan kunjungan keluarga.'),
    ('Hotel', 'hotel', 'Akomodasi hotel umum.'),
    ('Resort', 'hotel', 'Akomodasi resort untuk liburan.'),
    ('Villa / Cottage', 'hotel', 'Akomodasi villa, cottage, atau sejenisnya.'),
    ('Homestay / Penginapan', 'hotel', 'Homestay, guest house, dan penginapan sederhana.'),
    ('Seafood', 'restoran', 'Restoran dengan menu utama hasil laut.'),
    ('Kuliner Khas Daerah', 'restoran', 'Restoran yang menonjolkan makanan khas lokal.'),
    ('Rumah Makan Keluarga', 'restoran', 'Tempat makan untuk keluarga dan rombongan.'),
    ('Kafe & Kopi', 'restoran', 'Kafe, kedai kopi, dan tempat nongkrong.');
