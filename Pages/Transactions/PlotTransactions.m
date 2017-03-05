clear
trans = read_mixed_csv('H:/Downloads/data.csv', ',');
[entries,~] = size(trans);
mls = [31 29 31 30 31 30 31];

for n = 1:entries-1
    date = trans{n+1, 2};
    d = str2num(date(1:2));
    m = str2num(date(4:5));
    y = str2num(date(7:end));
    days(n) = datenum(y, m, d);
    amount(n) = str2num(trans{n+1,4});
    type = trans{n+1,6};
end


days = fliplr(days);
amount = fliplr(amount);

amount(amount < -4000) = 0; % When I withdrew my ISA money

count = 1;
for n = 1:length(days)
    if(n == 1)
        damount(count) = amount(n);
        currday = days(n);
        daylist(count) = currday;
    end
    
    thisday = days(n);
    
    if(thisday == currday)
        damount(count) = damount(count) + amount(n);
    else
        count = count + 1;
        damount(count) = amount(n);
        currday = thisday;
        daylist(count) = currday;
    end
end

plot(daylist, cumsum(damount) - damount(1))

set(gca, 'XTickLabel', datestr(get(gca, 'XTick')))