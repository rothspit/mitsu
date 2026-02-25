/**
 * populate-heaven-member-ids.js
 * 
 * This script populates the heaven_member_id column in the girls table
 * by matching names from the Heaven diary-casts API.
 * 
 * Prerequisites: 
 *   1. Run the migration first:
 *      ALTER TABLE girls ADD COLUMN IF NOT EXISTS heaven_member_id text;
 *   2. Then run: node scripts/populate-heaven-member-ids.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nuxojcydwxhecncbwjpb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('Error: Set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Mapping of girl_id -> heaven_member_id (generated from diary-casts API matching)
const MAPPINGS = [
  { id: 'd70784f9-af0d-4cb7-8be4-c7fe29aa8324', memberId: '55404799', name: 'あい' },
  { id: '16c74902-2088-4a25-bd4a-dd91e6f0f7b4', memberId: '58233107', name: 'あめ' },
  { id: 'b1d3076c-553f-4b3d-a084-6ba72c00c3f1', memberId: '61571826', name: 'いのり' },
  { id: 'c5672427-e7ad-47b9-b32f-1e476869141e', memberId: '61281044', name: 'うさぎ' },
  { id: 'a77d7b11-17a5-43b2-a126-d446b7b9b54a', memberId: '55057948', name: 'きい' },
  { id: '0d6008ec-7193-4ea8-8166-048e2a6f08ce', memberId: '61698874', name: 'ぐみ' },
  { id: 'fca8ad10-b4f6-4bed-8275-255cbb0a4ad7', memberId: '61988053', name: 'じゅり' },
  { id: 'cfe0a65d-005d-4229-a73e-1d12c302173c', memberId: '61551228', name: 'せら' },
  { id: 'f8c84530-cdc2-4826-93d8-15200e343224', memberId: '60191658', name: 'なずな' },
  { id: 'f01dc8ca-aa40-4385-b3c5-68408222bb26', memberId: '64055381', name: 'ねね' },
  { id: '125f3794-d374-4e5a-96eb-b6d24d489f31', memberId: '63034437', name: 'のあん' },
  { id: '945fcf29-b2ac-4fee-a074-e812c45ac3bf', memberId: '63117147', name: 'のえる' },
  { id: '523ec770-bf88-43fb-8a58-b3b61504d088', memberId: '60043696', name: 'ふゆ' },
  { id: '5bc31472-4ccf-46fb-a24f-8fcc1e331168', memberId: '61320511', name: 'まつり' },
  { id: '439d3d3c-5da7-42b4-8218-6303f1a753b7', memberId: '64126731', name: 'まふゆ' },
  { id: '8d967798-18ce-41d5-a393-2deae7e84b65', memberId: '63585536', name: 'まる' },
  { id: '63c63e4d-7c43-4451-b226-dde5617eb710', memberId: '61706880', name: 'まろん' },
  { id: 'e4bfe370-1953-41af-86c7-b3a364002082', memberId: '64365026', name: 'みいな' },
  { id: '9e3a173d-aa54-4d86-a457-6f9f1e769936', memberId: '61156263', name: 'みつり' },
  { id: '444ec2b4-65ae-4dfa-91f9-af5abc87dc98', memberId: '64201801', name: 'みるく' },
  { id: '28d3bdb8-038f-4240-9758-0065d551f601', memberId: '61523016', name: 'メグ' },
  { id: 'c9b36ee1-4cc4-4813-b9ad-8b12eb2f1e90', memberId: '62769316', name: 'らむ' },
  { id: 'f67fc121-d4a2-447b-86bd-dce19382a077', memberId: '63588290', name: 'リアナ' },
  { id: '8e239b47-741f-4b8c-b66a-dd5e179f0f65', memberId: '64294204', name: 'りあん' },
  { id: '673e43bd-85f3-443c-9a7d-d78d69b0c1d3', memberId: '62149794', name: 'るきあ' },
  { id: '330bc702-4f8b-4458-96d5-fce23ff4986e', memberId: '62799506', name: '一華（いちか）' },
  { id: '5b5475ed-6351-425d-bb24-23df515322ab', memberId: '62514941', name: '乃愛（のあ）' },
  { id: 'c9c92898-0a6b-4407-bbe9-ff7b2c4886ef', memberId: '60373125', name: '亜夢（あむ）' },
  { id: '9771c823-4541-43e8-9c94-de358397cbc9', memberId: '59601517', name: '亜里沙（ありさ）' },
  { id: '3b4041c0-b46d-4b23-b644-8ad37201dd45', memberId: '47712534', name: '京香（きょうか）' },
  { id: '901d6856-f6e8-4d8d-941b-4ee6b925daca', memberId: '63267106', name: '伊都（いと）' },
  { id: '1c3f3731-5590-4762-9a6a-6d68c9b8d6d6', memberId: '64430956', name: '優愛（ゆら）' },
  { id: 'cc445fb4-359e-4c05-ac73-242831b88a55', memberId: '63302553', name: '千夏（ちなつ）' },
  { id: '8a3dc170-02fd-46a5-a56c-6536403a65c9', memberId: '23338885', name: '千尋（ちひろ）' },
  { id: '48e663e6-fee2-4705-87cd-aa2afdd450e1', memberId: '63611592', name: '千鶴（ちづる）' },
  { id: '30f38376-3024-430f-9c2b-a0f11b5fdc55', memberId: '64284461', name: '史花（ふみか）' },
  { id: '50545071-140f-44fa-ae7e-a6ef83a7c8c2', memberId: '63725094', name: '和佳奈（わかな）' },
  { id: 'ac308fec-ce6c-4c81-865b-c274c68a336c', memberId: '11940370', name: '唯（ゆい）' },
  { id: '042cd789-a6c7-4455-8713-a18e91a5bd4a', memberId: '64128182', name: '夏乃（なつの）' },
  { id: 'ab39c9ad-30dd-4b2b-aaf6-72a69f134dc9', memberId: '59781324', name: '夕妃（ゆうひ）' },
  { id: '645fefcc-e043-4e37-a231-dd1b3f134404', memberId: '63298214', name: '夜宵（やよい）' },
  { id: 'a9d452e2-c353-4ec9-ab32-35bda631c81b', memberId: '63486872', name: '夢花（ゆめか）' },
  { id: '854b4b56-46e8-4985-a7d0-f782e9e5b5ed', memberId: '62168500', name: '天音（あまね）' },
  { id: '91d86285-153d-43c3-b582-ad372cf2294b', memberId: '64080083', name: '奈々（なな）' },
  { id: '851ab9d3-0c76-44f3-9042-3cd2cc647bb1', memberId: '63308107', name: '奈留（なる）' },
  { id: 'bd5caabf-66d1-4c19-b107-a188f34d6a42', memberId: '63014807', name: '奈美（なみ）' },
  { id: 'bbd1d596-9cfc-4c41-a927-e8ca6979a595', memberId: '61565308', name: '奏多（かなた）' },
  { id: 'ad6f9300-3dbc-4511-8816-e5b4ebc1e8b3', memberId: '63752778', name: '姫乃（ひめの）' },
  { id: '81fa95fe-7120-4c2c-b071-2e3d90238d55', memberId: '57536265', name: '尚美（なおみ）' },
  { id: '2f1ee9af-5e29-4d61-9b29-a9f7db0dabfb', memberId: '63410682', name: '希美（のぞみ）' },
  { id: 'b50374b7-e0c4-4c04-b104-c579975814f9', memberId: '63775597', name: '彩友梨（あゆり）' },
  { id: 'c1461de0-ef24-48b7-bd03-85b93bafe35c', memberId: '59843711', name: '彩葉（いろは）' },
  { id: '4ec18142-aa7b-4a65-8d60-6f959aa5846a', memberId: '62986258', name: '心（こころ）' },
  { id: '1f1bf7bd-33c9-40ac-bbb5-b2f186e78757', memberId: '62789470', name: '心愛（ここあ）' },
  { id: 'ca815e08-ae86-4070-a547-5bfa30c844a7', memberId: '64070780', name: '恋々菜（ここな）' },
  { id: '77d07a1d-de89-4c24-8073-10d0c0713cc6', memberId: '54400369', name: '恵美（めぐみ）' },
  { id: '9388423a-ed2a-4def-bac3-bac99f53953c', memberId: '64193035', name: '恵那（えな）' },
  { id: '069a9e05-526d-49ba-82bc-f10069dc3026', memberId: '60821554', name: '悠咲（ゆうさ）' },
  { id: '7cf62ba8-3dfb-4ffe-8727-7fc1152ffffe', memberId: '64568359', name: '愛澄（あずみ）' },
  { id: 'eafe1975-c017-4c81-9aab-f47adc8acf92', memberId: '64565541', name: '愛由（あゆ）' },
  { id: '44769788-e11e-4579-903d-1e3a6e071eb7', memberId: '63895573', name: '愛海（あみ）' },
  { id: 'f535f567-7666-4da1-a50b-f1c4eafb6cfd', memberId: '64470014', name: '愛実（まなみ）' },
  { id: '7d84db15-25c8-4e7b-a0f8-f0901a484dff', memberId: '62505102', name: '成海（なるみ）' },
  { id: '045f06b2-9ed9-42a6-9ccd-a3d3f0a6178d', memberId: '64369981', name: '日菜乃（ひなの）' },
  { id: '2b554a2c-b610-4de9-ba4b-f4b4073d8713', memberId: '30636128', name: '明日香（あすか）' },
  { id: 'a2125f33-9bca-4c5d-9587-6581bea88573', memberId: '64574345', name: '春佳（はるか）' },
  { id: '53b73c5d-6f48-4c74-9b1c-6ec473694ea3', memberId: '63845056', name: '月波（つきは）' },
  { id: 'ce24e1fb-3d22-43d2-b5b3-fa319b58a823', memberId: '60301089', name: '望美（のぞみ）' },
  { id: '7b70dbd4-cdb5-4f4f-aeb3-dc9430988c05', memberId: '61334837', name: '那月（なつき）' },
  { id: '010aae6b-9bb5-4c1b-9ce7-cd6311d9f4e5', memberId: '31039746', name: '由希子（ゆきこ）' },
  { id: '27d59edf-73ce-4838-be39-1be78fb2e7df', memberId: '51316308', name: '由梨奈（ゆりな）' },
  { id: 'fa39b585-1f7e-476e-a018-b843005d8a81', memberId: '64575605', name: '白乃（はくの）' },
  { id: 'e5507e9e-3944-479c-9d7e-ef8ee14acfd3', memberId: '62687880', name: '白奈（しろな）' },
  { id: '1df9f950-06e6-4026-b00e-35afa28c0d32', memberId: '64285444', name: '眞子（まこ）' },
  { id: '8be5204e-7308-4a55-b505-2fda5e0881dc', memberId: '62993427', name: '真優（まゆ）' },
  { id: 'eac7298a-3a2b-48e4-94b2-b56020e65f1a', memberId: '64070384', name: '真央（まお）' },
  { id: '422b5f71-62c3-4b4a-868b-2c89e7a143a5', memberId: '59578739', name: '真由美（まゆみ）' },
  { id: 'fbde003f-dcf1-4303-b95f-705ffbf5725b', memberId: '60770039', name: '真緒（まお）' },
  { id: '516cdecc-d5e5-4133-80a3-d426d3db26aa', memberId: '62910226', name: '紅凛（あかり）' },
  { id: '16ac4957-da5b-4f93-bb9f-9fa019bb5645', memberId: '63370695', name: '紅葉（もみじ）' },
  { id: '57c500ac-5ca4-4c3b-85f3-291d42156af9', memberId: '58843896', name: '紗世（さよ）' },
  { id: '80cf1ef6-2b6a-40f9-97f7-2d7da8272548', memberId: '61653264', name: '紗奈（さな）' },
  { id: '59f42fb3-8375-4e19-bc3a-0df1355a2e35', memberId: '60420949', name: '紗織（さおり）' },
  { id: '640a8a76-fca3-42eb-976a-038ef7c90489', memberId: '59835136', name: '紗良（さら）' },
  { id: 'dbfffa27-66d3-4f91-9d53-c07ab68b0c43', memberId: '63909887', name: '紫恵奈（しえな）' },
  { id: 'd0ae29ab-2081-4dcf-a348-96b6933e37d9', memberId: '64706264', name: '結奈（ゆな）' },
  { id: 'd4a7dfd8-9806-40f4-bee3-a7ddf8d77a9c', memberId: '63459069', name: '結由（ゆゆ）' },
  { id: 'e87dbb6a-a514-4f7a-8998-764add082f08', memberId: '63978022', name: '絵蓮（えれん）' },
  { id: 'a74877e3-f193-421f-8148-6dac0803dcce', memberId: '64356530', name: '綺羅（きら）' },
  { id: '595200fe-81ea-46c5-96d4-7bf615e6c7a1', memberId: '63500614', name: '美咲（みさき）' },
  { id: '55dac61a-3775-4343-970d-53cf52164a4e', memberId: '64131127', name: '美幸（みゆき）' },
  { id: '1a922599-5f02-498a-8496-262cf31648f0', memberId: '61405850', name: '美梨亜（みりあ）' },
  { id: '3b2d9491-3c4b-4050-a14a-42e498b1e604', memberId: '60191985', name: '美涼（みすず）' },
  { id: 'dc8752a4-f6a4-4646-9de2-3c494551cc50', memberId: '64392840', name: '美玲（みれい）' },
  { id: '7eb12add-e365-4fe1-b1f0-bac277d29f8e', memberId: '60334432', name: '美穂（みほ）' },
  { id: '821ac8a8-e670-40d8-b4fb-d660f18d8ad7', memberId: '64109105', name: '美紅（みく）' },
  { id: '21860efd-9bfc-4adb-a828-f9cbca37add5', memberId: '61849877', name: '美結（みゆ）' },
  { id: 'd265c007-c85b-47ba-8ca9-580fe2d40c4f', memberId: '62822123', name: '美菜（みな）' },
  { id: '70192d56-e49d-42fd-afed-91d991d68a42', memberId: '64424266', name: '美都（みと）' },
  { id: '89bb6f88-0489-4e1a-af19-eb9a4f0b705c', memberId: '60709268', name: '羽凛（うりん）' },
  { id: 'cfe2d67a-e5b6-46c3-b0fc-e3ac0d294537', memberId: '63963620', name: '羽那（うな）' },
  { id: 'f146beb9-03b1-4c5e-a343-4de9a61562e0', memberId: '64275705', name: '翠（すい）' },
  { id: '6221d365-06a1-4632-8a65-42135a97b645', memberId: '63629368', name: '葉音（はのん）' },
  { id: 'b78fddec-9336-4c27-aeaa-0541164a55be', memberId: '64261520', name: '葵（あおい）' },
  { id: '110444fc-62a5-47c8-a393-15215a911378', memberId: '63235323', name: '鈴々（すず）' },
  { id: '8c5eb105-9a44-420b-9e33-f118145d8071', memberId: '64543577', name: '陽彩乃（ぴあの）' },
  { id: '5c089009-849f-4cf4-9fe5-54a1de1afaa0', memberId: '64212014', name: '霞（かすみ）' },
  { id: 'f987d598-0e9f-44a5-bcc9-5828ea5ecca6', memberId: '52420647', name: '響紀（ひびき）' },
  { id: '70685cd2-5631-40a5-95d9-7281e24fa886', memberId: '64673775', name: '風香（ふうか）' },
  { id: '6bdd7545-0e57-461f-8047-ba09288732cb', memberId: '63964956', name: '餅子（もちこ）' },
  { id: '08361719-9ead-4620-a982-db99e15d46fd', memberId: '28708743', name: '香也（かや）' },
  { id: 'ec92ca9c-b9a8-48a6-a682-173eeb4b24d7', memberId: '63265903', name: '香凛（かりん）' },
  { id: '4ed7b9d7-8bfd-4720-bce2-a308727bb1d6', memberId: '64275552', name: '香里奈（かりな）' },
  { id: '4ca11560-7c5c-40a6-bc61-da25d975a517', memberId: '63605355', name: '麗（うらら）' },
  { id: '49693f03-6821-4354-93f4-ba157033d56b', memberId: '64267852', name: '麗華（れいか）' },
  { id: 'ca69e21c-88c8-446f-873e-c53c2087b2b6', memberId: '61819628', name: '麗蘭（れいら）' },
  { id: '8d2fe777-6806-4982-a09e-ea69ee49cfba', memberId: '63913885', name: '麗衣（れい）' },
  { id: 'ca70655c-a17f-4333-9128-1653abace6a1', memberId: '54561767', name: '麻美（あさみ）' },
  { id: '3d2c0498-31a2-4958-83d9-4df603569e64', memberId: '64080403', name: '苺（いちご）' },
  { id: '53dee9fc-0aec-4ab8-929a-193fe8d67c09', memberId: '62713530', name: '莉央（りお）' },
  { id: '713a8278-10ad-4d0f-9305-84fed5aaa851', memberId: '64045056', name: '莉子（りこ）' },
  { id: '7fd2de07-38f6-4a6e-983e-2b120b0d4f90', memberId: '64639711', name: '莉音（りおん）' },
  { id: '3f180f69-0675-4e1f-a6c9-99b413c755e7', memberId: '58570337', name: '菜々子（ななこ）' },
  { id: 'f95bcca7-4356-4882-acf8-4bbfffd6f954', memberId: '64275544', name: '菜乃（なの）' },
  { id: '6cd23156-e561-4282-a910-8233abc27ccf', memberId: '64557468', name: '華恋（かれん）' },
  { id: 'fcb0a63e-58cd-4ced-81d1-0bb7889b0383', memberId: '64413423', name: '萌由（もゆ）' },
  { id: '37d54e7a-0cb5-49e9-ad03-09c7e888afb0', memberId: '63062976', name: '桃花（もか）' },
  { id: '29c068fc-0078-48d3-b4d7-e79e11f17506', memberId: '64413419', name: '桃香（ももか）' },
  { id: 'b7ad740b-6c0e-4ec3-b5b8-cd240a3b2474', memberId: '62575626', name: '桃奈（ももな）' },
  { id: 'b85ea3a2-11b3-4d57-953c-469935eb93e3', memberId: '62600877', name: '芽衣（めい）' },
  { id: '50cabde5-2374-4d5b-9e68-966f25893a40', memberId: '60751998', name: '芽瑠（める）' },
  { id: '7d96643d-bc2a-490f-9812-60c01d117003', memberId: '60322027', name: '詩乃（しの）' },
  { id: '9c692b1a-06be-4290-a8b9-5327ac2c069b', memberId: '34833832', name: '里帆（りほ）' },
  { id: '0eff299e-c030-440f-bc9a-2be4ca1b0312', memberId: '62852331', name: '野乃（のの）' },
  { id: '3807fcbd-5458-435c-a21e-96845245fe78', memberId: '53436717', name: '璃紗（りさ）' },
  { id: '14a2411f-6109-44bd-96bf-8fdfdca3b1b4', memberId: '64686645', name: '梨沙（りさ）' },
  { id: '32ad5afd-15c7-4bf7-9d46-2a9aadb4b487', memberId: '63527562', name: '梨々香（りりか）' },
  { id: '60bdba0a-8018-4cf9-83be-b1a144bea7d9', memberId: '63145132', name: '梨良子（りょうこ）' },
  { id: 'b370675f-5ea4-4077-b5bd-ec490e30ed85', memberId: '61111346', name: '梨香子（りかこ）' },
  { id: 'b713c3dc-be22-4607-83b5-9ba9dce818ce', memberId: '63469850', name: '梨愛良（りあら）' },
  { id: 'd9483183-e155-471a-aca2-f9837385c5b0', memberId: '64260436', name: '梨花（りか）' },
  { id: '394dec0f-05a6-42ca-9e73-17c6651d5f79', memberId: '64327544', name: '梨那（りな）' },
  { id: 'a600c264-ab04-4d15-8cb1-4ae9cbf956ed', memberId: '61241892', name: '椿紀（つばき）' },
  { id: '7306b9e3-42cb-4af6-87e9-6f7c7c48a89b', memberId: '64126911', name: '玖由梨（くゆり）' },
  { id: 'ac88fc86-7624-4e10-b982-92572eb63ea5', memberId: '41514464', name: '理恵（りえ）' },
  { id: '2fcb003b-a791-4a10-84c0-882738bd8cea', memberId: '62079634', name: '琴音（ことね）' },
  { id: '26e3491d-7e80-4f96-970c-ade523b00f04', memberId: '64542081', name: '瑠華（るか）' },
  { id: '59f212c8-f751-4b6c-935c-6ecf86fa8449', memberId: '64216239', name: '沙南（さな）' },
  { id: 'c223526f-4d1a-42ea-81f8-fb42cde2454d', memberId: '57575874', name: '沙和（さわ）' },
  { id: '9338f655-18b0-440f-9e64-a19ea57fce0d', memberId: '55025688', name: '沙蘭（さらん）' },
  { id: '32266175-3540-4d65-a05b-71924ab464d4', memberId: '60762562', name: '海（うみ）' },
  { id: '7356110a-7206-44f9-ba15-a128c040da51', memberId: '64569710', name: '瀬恋（せれん）' },
  { id: 'df6cb63d-8a13-4ce8-89b6-06aed97ca61e', memberId: '29434066', name: '秋穂（あきほ）' },
  { id: 'adc664d1-b056-41c5-8121-9ea8bbe00aea', memberId: '59817602', name: '潤奈（じゅんな）' },
  { id: '0c5de410-1d06-47ea-83af-8ac246cac2e0', memberId: '64661932', name: '蘭（らん）' },
  { id: '4bc2732e-8dfd-40b2-aab8-1f41cd99c82b', memberId: '64410728', name: '杏菜（あんな）' },
];

async function main() {
  let success = 0;
  let failed = 0;

  for (const { id, memberId, name } of MAPPINGS) {
    const { error } = await supabase
      .from('girls')
      .update({ heaven_member_id: memberId })
      .eq('id', id);

    if (error) {
      console.error(`FAIL: ${name} (${id}) -> ${error.message}`);
      failed++;
    } else {
      console.log(`OK: ${name} -> ${memberId}`);
      success++;
    }
  }

  console.log(`\nDone: ${success} updated, ${failed} failed out of ${MAPPINGS.length} total`);
}

main().catch(console.error);
