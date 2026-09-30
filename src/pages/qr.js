import React, { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

const QRCodeGenerator = () => {
    const [link, setLink] = useState("");

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Enter URL"
                style={{
                    width: "300px",
                    padding: "10px",
                    marginBottom: "20px",
                }}
            />

            {link && (
                <>
                    <h3>Scan to Order</h3>

                    <QRCodeCanvas
                        value={link}
                        size={220}
                        level="H"
                        includeMargin={true}
                    />
                </>
            )}
        </div>
    );
};

export default QRCodeGenerator;