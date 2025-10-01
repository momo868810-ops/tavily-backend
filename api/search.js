// 文件路径: /api/search.js

// Vercel Edge Function 的推荐配置
export const config = {
  runtime: 'edge',
};

// 定义 CORS 响应头。这是最关键的一步。
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // 允许任何来源的请求。为了安全，生产环境可以替换成您的前端域名。
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // 允许的请求方法
  'Access-Control-Allow-Headers': 'Content-Type', // 允许的请求头
};

// 导出一个默认的异步函数作为 Serverless Function 的处理器
export default async function handler(request) {
  // 浏览器在发送 POST 请求前，会先发送一个 "预检" (preflight) OPTIONS 请求来询问服务器是否允许跨域。
  // 我们必须正确响应这个 OPTIONS 请求。
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204, // 状态码 204 表示 "No Content"，是 OPTIONS 请求的标准响应
      headers: CORS_HEADERS, // 返回我们定义好的 CORS 头
    });
  }

  // 确保只处理 POST 请求
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // 解析前端发来的 JSON 请求体
    const { query } = await request.json();

    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS, // 在每个响应中都带上 CORS 头
        },
      });
    }

    // 调用 Tavily API
    const tavilyResponse = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // process.env.TAVILY_API_KEY 会自动从 Vercel 的环境变量中读取
        'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: query,
        search_depth: 'basic',
        include_answer: true,
        max_results: 5,
      }),
    });

    if (!tavilyResponse.ok) {
      const errorText = await tavilyResponse.text();
      throw new Error(`Tavily API error: ${tavilyResponse.status} ${errorText}`);
    }

    const searchData = await tavilyResponse.json();

    // 将搜索结果整合成一个简洁的字符串
    const summarizedResult = `Search results for "${query}":\n` +
      (searchData.answer ? `Answer: ${searchData.answer}\n` : '') +
      searchData.results.map((item) => `- ${item.content}`).join('\n');

    // 将处理好的结果返回给前端
    return new Response(JSON.stringify({ result: summarizedResult }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS, // 在成功响应中也必须带上 CORS 头
      },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS, // 在错误响应中也必须带上 CORS 头
      },
    });
  }
}
