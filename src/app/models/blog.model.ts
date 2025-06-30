export interface Blog {
  // Temel Alanlar
  id?: number; // Blogun unique ID'si (opsiyonel, çünkü yeni oluşturulurken mevcut olmayabilir)
  title: string; // Blog başlığı
  content: string; // Blog içeriği
  slug?: string; // Blogun kısa URL için kullanılan dizisi (opsiyonel)

  // İlişkili Alanlar
  authorId?: number; // Blog yazarının ID'si (opsiyonel)
  authorUsername?: string; // Blog yazarının kullanıcı adı

  // Tarihler
  createdAt?: Date; // Blogun oluşturulma tarihi (opsiyonel)
  updatedAt?: Date; // Blogun güncellenme tarihi (opsiyonel)

  // Sayısal Alanlar
  commentCount?: number; // Bloga yapılmış yorum sayısı (opsiyonel)
  likesCount?: number; // Blogun aldığı toplam beğeni (opsiyonel)
  viewCount?: number; // Blogun aksi belirtilmedikçe toplam görüntülenme sayısı (opsiyonel)

  // Durum ve İşaretler
  isLiked: boolean; // Kullanıcının bu blogu beğenip beğenmediğini işaretleyen alan
  isFavorited?: boolean; // Kullanıcının bu blogu favorilerine ekleyip eklemediği

  // Diğer Alanlar
  excerpt?: string; // Blogun kısa özeti (opsiyonel, gönderilmezse boş olabilir)
  tags?: string[]; // Bloga eklenmiş etiketler (array formatına çevrildi)
  imageUrl?: string; // Blogun kapak görseli için URL (opsiyonel)
  readingTime?: number; // Blogun okunma süresi (dakika olarak, opsiyonel)
  status?: string; // Blogun durumu: "DRAFT", "PUBLISHED" vb. (opsiyonel)
  isDeleted?: boolean; // Blogun silinme durumu (opsiyonel)

  // Kategoriler
  categories?: Category[]; // Blog ile ilişkili kategoriler için array alanı
}

// Kategori Interface'i (Yanıt JSON'una uygun biçimde)
export interface Category {
  id: number; // Kategori ID'si
  name: string; // Kategori adı
}
export interface BlogRequest {
  title: string;
  content: string;
}
