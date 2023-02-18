

function subtractMonths(date, numMonths) {
    const sentDate = new Date(date)
    let returnDate = new Date();
    let i = 0;
    while (i < numMonths) {
        if (new Date(date).getMonth() === 0) {
            returnDate = new Date(sentDate.getFullYear() - 1, '11', sentDate.getDate());
        } else {
            returnDate = new Date(sentDate.setMonth(sentDate.getMonth() - 1));
        }
        i += 1;
    }
    return returnDate;
}

function addMonths(date, numMonths) {
    let returnDate = new Date(date);
    let i = 0;
    while (i < numMonths) {
        if (returnDate.getMonth() !== 11) {
            returnDate = new Date(returnDate.setMonth(returnDate.getMonth() + 1));
        } else {
            returnDate = new Date(returnDate.getFullYear() + 1, '00', returnDate.getDate());
        }
        i += 1;
    }
    return returnDate;
}
exports.subtractMonths = subtractMonths;
exports.addMonths = addMonths;