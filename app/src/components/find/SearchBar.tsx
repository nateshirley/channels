import React, { useEffect, useState, useCallback, FormEvent } from "react";
import "../../Global.css";

interface SearchBarProps {
    handleSearchChange: (value: string) => void,
    searchText: string,
    didPressSearch: () => Promise<void>
}

function SearchBar(props: SearchBarProps) {

    const keyPress = (event: any) => {
        if (event.key === "Enter") {
            props.didPressSearch()
        }
    }

    return (
        <input
            placeholder="search channel name or wallet address"
            onChange={e => props.handleSearchChange(e.target.value)}
            onKeyPress={keyPress}
            value={props.searchText}
            className="default-input search"
        />
    );


}

export default SearchBar;