module.exports = async function handler(req, res) {
  // 设置跨域允许
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    let url = req.query.url;

    if (!url) {
      return res.status(400).json({ success: false, error: "缺少 url 参数" });
    }

    // 🌟 1. 填入你的专属 API 密钥
    const apiKey = "f05b8c025b4492cceb6314581a3c41bd";
    
    // 根据文档，直接拼接请求地址
    const apiUrl = `https://api.66laji.cn/api/spqushuiyin/index.php?apikey=${apiKey}&url=${encodeURIComponent(url)}`;

    // 🌟 2. 发起 GET 请求
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      }
    });

    const data = await response.json();

    // 🌟 3. 精准解析返回结果 (严格按照接口文档的说明)
    // 文档示例显示，获取成功时 code 为 0
    if (data.code === 0 && data.data) { 
      
      const itemData = data.data;
      let finalUrl = itemData.video_url;
      let title = itemData.desc || itemData.title || "解析成功";

      // 💡 额外的小优化：如果用户输入的是图文（图片），尝试返回第一张无水印图片
      if (!finalUrl && itemData.type === "image" && itemData.images && itemData.images.length > 0) {
          finalUrl = itemData.images[0];
          title = "[图文作品] " + title;
      }

      if (!finalUrl) {
          throw new Error("解析成功，但未能提取到视频或图片链接");
      }

      return res.status(200).json({
        success: true,
        video: finalUrl,
        desc: title,
      });

    } else {
      // 获取 msg 字段中的错误提示返回给前端
      throw new Error(data.msg || "API 接口解析失败");
    }

  } catch (e) {
    return res.status(500).json({
      success: false,
      error: "服务器解析异常",
      detail: e.message,
    });
  }
};
