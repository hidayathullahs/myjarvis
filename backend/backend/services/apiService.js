const fetchFromAPI = async (url) => {
    const response = await fetch(url);
    return await response.json();
};

module.exports = { fetchFromAPI };
