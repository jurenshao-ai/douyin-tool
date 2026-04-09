module.exports = async function handler(req, res) {
  // 设置一下 CORS，防止某些情况下的跨域报错
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    let url = req.query.url;

    if (!url) {
      return res.status(400).json({ success: false, error: "缺少 url 参数" });
    }

    // 1️⃣ 先获取跳转后的真实地址
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
      },
    });

    const realUrl = response.url;

    // 2️⃣ 提取 video id (增强正则，排除图文的干扰)
    const videoMatch = realUrl.match(/video\/(\d+)/);
    if (!videoMatch) {
      const noteMatch = realUrl.match(/note\/(\d+)/);
      if (noteMatch) {
         return res.status(400).json({ success: false, error: "您输入的是图文作品链接，当前仅支持视频解析" });
      }
      return res.status(500).json({ success: false, error: "无法解析该链接，请确认是否为有效的抖音分享链接" });
    }

    const videoId = videoMatch[1];

    // 3️⃣ 调用抖音接口
    const api = `https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/?item_ids=${videoId}&aid=1128`;

    const dataRes = await fetch(api, {
      method: "GET",
      headers: {
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X)",
      },
    });

    const dataText = await dataRes.text();

    if (!dataText) {
      throw new Error("抖音接口返回空数据");
    }

    // 👉 防止 JSON 解析导致程序崩溃
    let data;
    try {
      data = JSON.parse(dataText);
    } catch (e) {
      throw new Error("触发抖音风控，接口返回了非 JSON 格式数据");
    }

    // 🚨 核心防风控拦截：校验数据结构是否完整
    if (!data || !data.item_list || data.item_list.length === 0) {
      return res.status(500).json({ success: false, error: "未获取到视频数据，Vercel 节点可能被抖音风控拦截" });
    }

    const item = data.item_list[0];

    // 确保视频节点存在
    if (!item.video || !item.video.play_addr || !item.video.play_addr.url_list) {
        return res.status(500).json({ success: false, error: "抖音视频地址结构发生改变，解析失败" });
    }

    // 4️⃣ 获取无水印视频
    let video = item.video.play_addr.url_list[0];

    // 去水印关键：替换 playwm → play
    video = video.replace("playwm", "play");

    // 再请求一次拿最终直链 (处理302重定向)
    const finalVideo = await fetch(video, {
      headers: {
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X)",
      },
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
