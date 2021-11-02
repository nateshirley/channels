import "../Global.css";
import { Provider } from '@project-serum/anchor';
import React, { useEffect, useState, useCallback } from "react";

interface GetProvider {
    getProvider: () => Provider
}

function New(props: GetProvider) {

    return (
        <div className="component-parent">
            new
        </div>
    );
}

export default New;