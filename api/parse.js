export default async function handler(req, res) {
    try {
        let url = req.query.url;

        // 1. 获取真实链接
        let r = await fetch(url, { redirect: "manual" });
        let real = r.headers.get("location");

        // 2. 提取ID
        let id = real.match(/video\/(\d+)/)[1];

        // 3. 请求抖音接口
        let api = `https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/?item_ids=${id}`;
        let data = await fetch(api).then(r=>r.json());

        let item = data.item_list[0];

        let desc = item.desc;
        let video = item.video.play_addr.url_list[0].replace("playwm", "play");

        res.status(200).json({ desc, video });

    } catch(e){
        res.status(500).json({ error: "解析失败" });
    }
}
