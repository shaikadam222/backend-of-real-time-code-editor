exports.handler = async function (event, context) {
    try {
        const url = `https://app.netlify.com/sites/imaginative-centaur-0345d7${event.path}`;
        const response = await fetch(url);

        // Always retrieve the response as text
        const data = await response.text();

        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
    } catch (error) {
        console.error('Error in proxy.js:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error', details: error.message }),
        };
    }
};
