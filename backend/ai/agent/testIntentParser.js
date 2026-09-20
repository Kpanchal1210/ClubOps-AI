require("dotenv").config({
    path: "../../.env"
});

const { parseIntent } = require("./intentParser");

const test = async () => {
    try {

        const command =
    "Mark the Contact sponsors task as completed";

        const result = await parseIntent(command);

        console.log("Parsed Intent:");
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {

        console.error("Intent Parser Error:", error);

    }
};

test();