module.exports = async function handler(req, res) {
  try {
    let url = req.query.url;

    if (!url) {
      return res.status(400).json({ error: "缺少 url 参数" });
    }

    // 1️⃣ 先获取跳转后的真实地址
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "user-agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X)",
      },
    });

    const realUrl = response.url;

    // 2️⃣ 提取 video id
    const match = realUrl.match(/video\/(\d+)/);
    if (!match) {
      return res.status(500).json({ error: "解析ID失败" });
    }

    const videoId = match[1];

    // 3️⃣ 调用抖音接口
    const api = `https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/?item_ids=${videoId}`;

    const data = await fetch(api).then((r) => r.json());

    const item = data.item_list[0];

    // 4️⃣ 获取无水印视频
    let video = item.video.play_addr.url_list[0];

    // 去水印关键：替换 playwm → play
    video = video.replace("playwm", "play");

    // 再请求一次拿最终直链
    const finalVideo = await fetch(video, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X)",
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
      error: "解析失败",
      detail: e.message,
    });
  }
};
