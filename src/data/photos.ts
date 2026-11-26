/**
 * Catalogue photography for the demo: real photos from Unsplash (free "Unsplash License": commercial and non-commercial
 * use, no permission or credit required; credit is shown anyway). Only images.unsplash.com photos are used, never the
 * paid Unsplash+ ones. Photos are hot-linked from the Unsplash CDN, nothing is copied into the repository.
 *
 * They are REPRESENTATIVE photos, not pictures of a real shop's goods: a shop uploads its own photos in the admin panel,
 * and uploaded photos always take priority over these.
 */
export interface Photo {
  /** CDN id: https://images.unsplash.com/<id> */
  id: string
  author: string
  /** photo page on unsplash.com (credit link) */
  page: string
  /** what the photographer's description says is in the picture */
  alt: string
  /** CSS object-position, when the garment is not in the middle */
  focus?: string
}

const p = (id: string, author: string, page: string, alt: string, focus?: string): Photo => ({ id, author, page: `https://unsplash.com/photos/${page}`, alt, ...(focus ? { focus } : {}) })

export const PRODUCT_PHOTOS: Record<string, Photo[]> = {
  's-sneaker-1': [
    p('photo-1544441892-794166f1e3be', 'Mnz', 'BeClz11lyXY', 'Pair of white low-top sneakers'),
    p('photo-1600269452121-4f2416e55c28', 'Jeff Tumale', 'SD9Jyl1xNQ4', 'White sneaker on athletic clothing'),
  ],
  's-sneaker-2': [
    p('photo-1574020462714-5451391cc336', 'Sara Kurfeß', 'person-wearing-black-mesh-sneaker-WM6Kyt_ndIw', 'Person wearing a black mesh sneaker'),
    p('photo-1682381886432-ced34bdbd033', 'Valeriia Neganova', 'a-pair-of-black-and-white-tennis-shoes-py2rK6daxPE', 'Pair of black and white tennis shoes'),
  ],
  's-sneaker-3': [p('photo-1760616172899-0681b97a2de3', 'taha siddiqui', 'black-loafers-with-white-background-NySU2CFS9Eo', 'Black loafers on a white background')],
  's-shirt-1': [
    p('photo-1602810318383-e386cc2a3ccf', 'Nimble Made', 'white-button-up-shirt-on-brown-wooden-table-7RIMS-NMsbc', 'White button-up shirt on a wooden table'),
    p('photo-1603252109612-24fa03d145c8', 'Nimble Made', 'man-in-white-button-up-shirt-GDebkNryTd4', 'Man in a white button-up shirt'),
  ],
  's-shirt-2': [p('photo-1776838108803-91bbab8a09da', 'Pesce Huang', 'tan-shirt-and-black-pants-on-hangers-2xEksgjlbpQ', 'Tan shirt and black trousers on hangers')],
  's-shirt-3': [
    p('photo-1619679692237-2c702521a30c', 'Kateryna Hliznitsova', 'woman-in-white-dress-shirt-sitting-on-white-couch-1WKRT2mvN0U', 'Woman in a white shirt'),
    p('photo-1718278867451-0af1bcb0dfc5', 'sombre', 'a-womans-hand-is-on-a-white-blouse-2jK5PeQmDsY', 'Close-up of a white blouse'),
  ],
  's-tee-1': [
    p('photo-1575737132307-1fad104f1f67', 'Haidan', 'red-t-shirt-dyZff_-rRBQ', 'Red T-shirt'),
    p('photo-1624373607006-348f61ea2d76', 'Marlon Alves', 'man-in-red-crew-neck-t-shirt-fRlsgH_MTNw', 'Man in a red crew-neck T-shirt'),
  ],
  's-tee-2': [p('photo-1621951753163-ee63e7fc147e', 'Geoffroy Danest', 'man-in-blue-crew-neck-t-shirt-holding-blue-plastic-hanger-m7EcTSm1RA4', 'Man in a blue crew-neck T-shirt')],
  's-tee-3': [
    p('photo-1671438118097-479e63198629', 'Mediamodifier', 'a-white-polo-shirt-hanging-on-a-clothes-rack-F5i3PZXYkvY', 'White polo shirt on a clothes rack'),
    p('photo-1720514496161-914011a9ee02', 'TuanAnh Blue', 'two-white-and-blue-polo-shirts-on-a-white-background-U199aciOyEU', 'White and blue polo shirts'),
  ],
  's-pants-1': [p('photo-1768289222386-93b3e854cf31', 'IMANA', '0Co8788ZtOc', 'Navy trousers')],
  's-pants-2': [
    p('photo-1789110520410-4fce7246f844', 'engin akyurt', 'person-wearing-light-green-cropped-trousers-3WDPbgyV1ec', 'Light green drawstring trousers'),
    p('photo-1687825515654-23620796760c', 'Laura Oliveira', 'a-woman-in-a-white-top-and-green-pants-moEtNGG8tM4', 'Woman in green trousers'),
  ],
  's-pants-3': [
    p('photo-1714143136372-ddaf8b606da7', 'TuanAnh Blue', 'a-pair-of-blue-jeans-on-a-white-background-9yoXrG6Er_g', 'Blue jeans on a white background'),
    p('photo-1637069585336-827b298fe84a', 'Claire Abdo', 'a-stack-of-jeans-sitting-on-top-of-each-other-aWLTXw6kbDw', 'Stack of folded jeans'),
  ],
  's-dress-1': [
    p('photo-1776594547647-f32691bbe6e1', 'Ashford Marx', 'woman-in-red-dress-by-the-ocean-8YkFjLoHUu0', 'Woman in a red dress by the ocean'),
    p('photo-1779021360320-4c3ee51098a2', '光术 山影', 'woman-in-red-dress-enjoying-a-garden-7GnHf9rp0qk', 'Woman in a red dress in a garden'),
  ],
  's-dress-2': [
    p('photo-1765229281558-b0a2555894af', 'FOTOGRAFÍA EDITORIAL', 'woman-in-a-sparkling-blue-formal-gown-doT34eWsi1U', 'Woman in a blue evening gown'),
    p('photo-1758728836733-269aacb10068', 'Gabriel Ogulu', 'woman-in-elegant-blue-dress-with-back-tattoo-oVnL3TRkzDg', 'Blue evening dress, back view'),
  ],
  's-jacket-1': [
    p('photo-1629353689974-af4d5c70440f', 'iam_os', 'man-in-green-jacket-standing-near-white-wall-9wM5SCjhsOM', 'Man in a green jacket'),
    p('photo-1746960875810-dcba437fe353', 'Malcolm Broström', 'stylish-man-poses-with-a-green-jacket-f5RoogJhRik', 'Man posing in a green jacket'),
  ],
  's-jacket-2': [
    p('photo-1611312449408-fcece27cdbb7', 'Caio Coelho', 'blue-denim-button-up-jacket-QRN47la37gw', 'Blue denim jacket'),
    p('photo-1543076447-215ad9ba6923', 'kemal alkan', 'blue-washed-jacket-hanging-on-white-door-_BDBEP0ePQc', 'Washed denim jacket on a door'),
  ],
  's-hoodie-1': [
    p('photo-1556821840-3a63f95609a7', 'Jannes Jacobs', 'man-wearing-grey-pullover-hoodie-a_KC8ocB650', 'Man wearing a grey hoodie'),
    p('photo-1632073143817-8cd5b2165e20', 'adriaan venner scheepers', 'a-man-in-a-gray-hoodie-standing-in-front-of-a-wall-qHnmgJya2Zg', 'Man in a grey hoodie by a wall'),
  ],
  's-hoodie-2': [
    p('photo-1757495404191-e94ed7e70046', 'Dev Benjamin', 'young-woman-with-blonde-hair-wearing-a-dark-hoodie-xqhif3j_SAg', 'Woman in a dark hoodie'),
    p('photo-1677538537484-324385aff147', 'Mohamed youssry', 'a-man-in-a-black-hoodie-standing-in-a-parking-garage-KMwpYURfx6E', 'Man in a black hoodie'),
  ],
  's-sweater-1': [
    p('photo-1687275161342-8699c61e4364', 'Ihor Rapita', 'a-white-sweater-hanging-on-a-clothes-rack-m2chM9O-ZHs', 'White sweater on a clothes rack'),
    p('photo-1588271968087-4c51abe05afc', 'Tamas Pap', 'woman-in-white-knit-sweater-XvfquM7g81E', 'Woman in a white knit sweater'),
  ],
  's-sweater-2': [
    p('photo-1782226739532-73cbe6cfb204', 'Jonathan Adams', 'Ddf5viqNPnU', 'Blue and white striped knit fabric'),
    p('photo-1771616555220-d5306e687f47', 'Brooke Balentine', 'a-woman-with-dark-hair-wearing-a-striped-sweater-gC6UbAc12jI', 'Woman in a striped sweater'),
  ],
  's-coat-1': [
    p('photo-1770644935626-f61d233f4827', 'Margo Evardson', 'dnCcCJvk0Ic', 'Woman in a beige coat'),
    p('photo-1633821879282-0c4e91f96232', 'Dane Moukao', 'a-woman-in-a-trench-coat-posing-for-a-picture-5vrque5NVHI', 'Woman in a trench coat'),
  ],
  's-coat-2': [p('photo-1611025504703-8c143abe6996', 'Alexandra Tran', 'woman-in-black-bubble-jacket-standing-beside-white-concrete-wall-during-daytime-1CQ10de2cRU', 'Woman in a puffer jacket')],
  's-acc-1': [
    p('photo-1708799366365-a24608103bed', 'Barry A', 'a-pair-of-black-sunglasses-on-a-white-background-n55O2wvZ2FY', 'Black sunglasses on a white background'),
    p('photo-1600024914363-d9bf85e438f0', 'Laura Chouette', 'black-framed-sunglasses-on-white-textile-NoqrVeKJCwE', 'Black sunglasses on white textile'),
  ],
  's-acc-2': [
    p('photo-1664286074176-5206ee5dc878', 'seeetz', 'a-leather-belt-on-a-black-surface-eNEa7Gsfzzs', 'Leather belt'),
    p('photo-1611937685025-8d1df67a80b6', 'Hermes Rivera', 'black-leather-belt-on-blue-denim-jeans-KhpPdaFGQvY', 'Black leather belt on denim'),
  ],
  's-bag-1': [p('photo-1584917865442-de89df76afd3', 'Arno Senoner', 'red-leather-handbag-on-white-table-oCXVxwTFwqE', 'Red leather handbag')],
  's-bag-2': [
    p('photo-1642375352724-8b523c67b8be', 'Sindre Aalberg', 'a-black-backpack-sitting-on-top-of-a-white-pedestal-ajEo1YX-bfo', 'Black backpack on a pedestal'),
    p('photo-1624292981551-e3aa15c0056d', 'Maksym Tymchyk', 'black-leather-backpack-on-gray-concrete-bench-DA1_lTYXHSY', 'Black leather backpack on a bench'),
  ],
  's-bag-3': [
    p('photo-1620786514684-ff35b5aae55e', 'Maryam Nemati', 'black-sling-bag-on-white-surface-LW2iqpHzr8Y', 'Black sling bag'),
    p('photo-1620786514669-06e2340fce71', 'Maryam Nemati', 'black-sling-bag-on-white-surface-hWs4qKwJkD4', 'Black sling bag, second angle'),
  ],
}

export const BANNER_PHOTOS: Record<string, Photo> = {
  'b-new': p('photo-1603400521630-9f2de124b33b', 'Thom Bradley', 'clothing-racks-with-neutral-toned-garments-mwa_nzFpnJw', 'Clothing racks with neutral garments'),
  'b-original': p('photo-1441984904996-e0b6ba687e04', 'Clark Street Mercantile', 'clothing-boutique-interior-with-hanging-racks-qnKhZJPKFD8', 'Boutique interior'),
  'b-sale': p('photo-1567401893414-76b7b1e5a7a5', 'Burgess Milner', 'assorted-color-clothes-OYYE4g-I5ZQ', 'Assorted clothes'),
}

export const photosOf = (productId: string): Photo[] => PRODUCT_PHOTOS[productId] ?? []
export const allPhotos = (): Photo[] => [...Object.values(PRODUCT_PHOTOS).flat(), ...Object.values(BANNER_PHOTOS)]

/** A cropped, compressed rendition of the wanted size (the CDN picks WebP/AVIF when the phone supports it). */
export const photoUrl = (photo: Photo, width: number, height: number): string =>
  `https://images.unsplash.com/${photo.id}?auto=format&fit=crop&w=${width}&h=${height}&q=72`
