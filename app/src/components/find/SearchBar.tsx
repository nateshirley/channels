import React, { useEffect, useState, useCallback } from "react";
import "../../Global.css";

interface SearchBarProps {
    handleSearchChange: (value: string) => void,
    searchText: string
}

function SearchBar(props: SearchBarProps) {


    return (
        <input
            placeholder="search wallet or pack mint"
            onChange={e => props.handleSearchChange(e.target.value)}
            value={props.searchText}
            className="default-input search"
        />
    );


}

export default SearchBar;