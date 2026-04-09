export default async function handler(req, res) {
try {
let url = req.query.url;

```
// 1. 获取真实跳转链接（关键修复）
let r = await fetch(url, {
  method: "GET",
  redirect: "manual",
  headers: {
    "user-agent": "Mozilla/5.0"
  }
});

let real = r.headers.get("location");
if (!real) throw new Error("获取跳转失败");

// 2. 提取ID
let match = real.match(/video\/(\d+)/);
if (!match) throw new Error("解析ID失败");

let id = match[1];

// 3. 调接口
let api = `https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/?item_ids=${id}`;
let data = await fetch(api).then(r => r.json());

let item = data.item_list[0];

let desc = item.desc;
let video = item.video.play_addr.url_list[0].replace("playwm", "play");

res.status(200).json({ desc, video });
```

} catch (e) {
res.status(500).json({ error: e.message });
}
}
