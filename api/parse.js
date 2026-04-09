module.exports = async function handler(req, res) {
  // 设置跨域允许
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    let url = req.query.url;

    if (!url) {
      return res.status(400).json({ success: false, error: "缺少 url 参数" });
    }

    // 🌟 核心破局点：伪装成正常电脑浏览器的请求头，包含假 Cookie 绕过风控
    const fakeHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Referer": "https://www.douyin.com/",
      "Cookie": "ttwid=1w; odin_tt=1w;" // 随便给个假值，抖音有时只要看到有这个键就不拦截
    };

    // 1️⃣ 先获取跳转后的真实地址
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: fakeHeaders,
    });

    const realUrl = response.url;

    // 2️⃣ 提取 video id
    const videoMatch = realUrl.match(/video\/(\d+)/);
    if (!videoMatch) {
      const noteMatch = realUrl.match(/note\/(\d+)/);
      if (noteMatch) {
         return res.status(400).json({ success: false, error: "您输入的是图文链接，当前仅支持视频" });
      }
      return res.status(500).json({ success: false, error: "解析视频ID失败，可能是链接已失效" });
    }

    const videoId = videoMatch[1];

    // 3️⃣ 调用抖音接口
    const api = `https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/?item_ids=${videoId}&aid=1128`;

    const dataRes = await fetch(api, {
      method: "GET",
      headers: fakeHeaders, // 🌟 这里也用上伪装头
    });

    const dataText = await dataRes.text();

    if (!dataText) {
      throw new Error("抖音接口依然返回空数据，Vercel 节点可能被严控");
    }

    // 👉 防止 JSON 解析导致程序崩溃
    let data;
    try {
      data = JSON.parse(dataText);
    } catch (e) {
      throw new Error("接口返回非 JSON 数据 (可能弹出了滑块验证码)");
    }

    // 🚨 校验数据结构是否完整
    if (!data || !data.item_list || data.item_list.length === 0) {
      return res.status(500).json({ success: false, error: "视频可能已被删除，或风控导致未返回视频实体" });
    }

    const item = data.item_list[0];

    if (!item.video || !item.video.play_addr || !item.video.play_addr.url_list) {
        return res.status(500).json({ success: false, error: "视频地址结构异常" });
    }

    // 4️⃣ 获取无水印视频并替换标识
    let video = item.video.play_addr.url_list[0];
    video = video.replace("playwm", "play"); // playwm 是有水印，play 是无水印

    // 再请求一次拿最终直链
    const finalVideo = await fetch(video, {
      headers: fakeHeaders,
      redirect: "follow",
    });

    return res.status(200).json({
      success: true,
      video: finalVideo.url,
      desc: item.desc,
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      error: "解析异常",
      detail: e.message,
    });
  }
};
