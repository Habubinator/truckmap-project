export const mailHtml = (
  title: string,
  description: string,
  href: string,
  buttonText: string,
) => `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Email</title>
        <style media="all" type="text/css">
            body {
                font-family: "Geologica", sans-serif;
                -webkit-font-smoothing: antialiased;
                font-size: 16px;
                line-height: 1.3;
                -ms-text-size-adjust: 100%;
                -webkit-text-size-adjust: 100%;
            }

            table {
                border-collapse: separate;
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                width: 100%;
            }

            table td {
                font-family: Helvetica, sans-serif;
                font-size: 16px;
                vertical-align: top;
            }

            body {
                background-color: #fff;
                margin: 0;
                padding: 0;
            }

            h1,
            h2,
            h3,
            h4,
            h5,
            h6,
            p {
                font-family: "Geologica", sans-serif;
                margin: 0;
                padding: 0;
            }

            .body {
                width: 100%;
                background-color: #fff;
                margin-top: 24px;
                margin-bottom: 24px;
            }

            .container {
                max-width: 600px;
                width: 600px;
                margin: 0 auto !important;
                padding: 0;
            }

            .content {
                max-width: 600px;
                display: block;
                box-sizing: border-box;
                background-color: #dadbe3;
                border-radius: 10px;
                margin: 0 auto;
                padding: 20px;
            }
        
            .content__title {
                font-size: 16px;
                font-weight: 700;
                color: #000;
                line-height: 20px;
                margin-top: 15px;
            }

            .content__text {
                font-size: 14px;
                font-weight: 400;
                color: #000;
                line-height: 18px;
                margin-top: 10px;
            }
        </style>
    </head>
    <body>
        <table
            role="presentation"
            border="0"
            cellpadding="0"
            cellspacing="0"
            class="body"
        >
            <tr>
                <td class="container">
                    <div class="content">
                        <h3 class="content__title">${title}</h3>
                        <p class="content__text">
                            ${description}
                            <a href="${href}">${buttonText}</a>
                        </p>
                    </div>
                </td>
            </tr>
        </table>
    </body>
</html>
`;

export const codeHTML = (
  title: string,
  description: string,
  activationCode: string,
) => `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Email</title>
        <style media="all" type="text/css">
            body {
                font-family: "Geologica", sans-serif;
                -webkit-font-smoothing: antialiased;
                font-size: 16px;
                line-height: 1.3;
                -ms-text-size-adjust: 100%;
                -webkit-text-size-adjust: 100%;
            }

            table {
                border-collapse: separate;
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                width: 100%;
            }

            table td {
                font-family: Helvetica, sans-serif;
                font-size: 16px;
                vertical-align: top;
            }

            body {
                background-color: #fff;
                margin: 0;
                padding: 0;
            }

            h1,
            h2,
            h3,
            h4,
            h5,
            h6,
            p {
                font-family: "Geologica", sans-serif;
                margin: 0;
                padding: 0;
            }

            .body {
                width: 100%;
                background-color: #fff;
                margin-top: 24px;
                margin-bottom: 24px;
            }

            .container {
                max-width: 600px;
                width: 600px;
                margin: 0 auto !important;
                padding: 0;
            }

            .content {
                max-width: 600px;
                display: block;
                box-sizing: border-box;
                background-color: #dadbe3;
                border-radius: 10px;
                margin: 0 auto;
                padding: 20px;
            }
        
            .content__title {
                font-size: 16px;
                font-weight: 700;
                color: #000;
                line-height: 20px;
                margin-top: 15px;
            }

            .content__text {
                font-size: 14px;
                font-weight: 400;
                color: #000;
                line-height: 18px;
                margin-top: 10px;
            }
        </style>
    </head>
    <body>
        <table
            role="presentation"
            border="0"
            cellpadding="0"
            cellspacing="0"
            class="body"
        >
            <tr>
                <td class="container">
                    <div class="content">
                        <h3 class="content__title">${title}</h3>
                        <p class="content__text">
                            ${description}
                        </p>
                        <h3> 
                            ${activationCode}
                        </h3>
                    </div>
                </td>
            </tr>
        </table>
    </body>
</html>
`;
