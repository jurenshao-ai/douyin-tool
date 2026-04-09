module.exports = async function handler(req, res) {
  // 设置跨域允许
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    let url = req.query.url;

    if (!url) {
      return res.status(400).json({ success: false, error: "缺少 url 参数" });
    }

    // 🌟 换用另一个非常出名且稳定的免费去水印接口 (韩小韩API)
    const apiUrl = `https://api.vvhan.com/api/wm?url=${encodeURIComponent(url)}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      }
    });

    // 🛡️ 防崩溃保护：先拿纯文本，不着急转 JSON
    const rawText = await response.text();

    // 检查是不是被防火墙拦截，返回了 HTML 网页
    if (rawText.trim().startsWith("<")) {
      throw new Error("第三方接口开启了防爬虫验证，Vercel 海外节点被拦截");
    }

    // 确认是安全的数据后再解析
    const data = JSON.parse(rawText);

    // 韩小韩 API 的成功标识是 success 为 true
    if (data.success) {
      return res.status(200).json({
        success: true,
        video: data.video || data.url, // 兼容接口可能返回的不同字段
        desc: data.title || data.desc || "解析成功！",
      });
    } else {
      throw new Error(data.message || "第三方接口解析失败");
    }

  } catch (e) {
    return res.status(500).json({
      success: false,
      error: "服务器解析异常",
      detail: e.message,
    });
  }
};
